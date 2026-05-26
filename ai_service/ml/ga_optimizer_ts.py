"""Time-series GA optimizer for SVR hyperparameters.

This is a variant of `ml/ga_optimizer.py` that uses `TimeSeriesSplit` instead of
plain KFold, to avoid leakage when optimizing models for forecasting.

We keep the same search space (C, epsilon, gamma) and GA operators.
"""

from __future__ import annotations

import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.svm import SVR


PARAM_BOUNDS = {
    "C": (0.1, 1000.0),
    "epsilon": (0.001, 1.0),
    "gamma": (0.0001, 10.0),
}


DEFAULT_GA_CONFIG = {
    "population_size": 16,
    "n_generations": 20,
    "crossover_rate": 0.8,
    "mutation_rate": 0.1,
    "tournament_size": 3,
    "cv_splits": 5,
    "random_seed": 42,
}


def _random_individual(rng: np.random.Generator) -> np.ndarray:
    return np.array(
        [
            rng.uniform(*PARAM_BOUNDS["C"]),
            rng.uniform(*PARAM_BOUNDS["epsilon"]),
            rng.uniform(*PARAM_BOUNDS["gamma"]),
        ]
    )


def _decode(individual: np.ndarray) -> dict:
    return {
        "C": float(np.clip(individual[0], *PARAM_BOUNDS["C"])),
        "epsilon": float(np.clip(individual[1], *PARAM_BOUNDS["epsilon"])),
        "gamma": float(np.clip(individual[2], *PARAM_BOUNDS["gamma"])),
        "kernel": "rbf",
    }


def _rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def _fitness_ts(
    individual: np.ndarray,
    X: np.ndarray,
    y: np.ndarray,
    *,
    cv_splits: int,
) -> float:
    """Fitness = negative RMSE over TimeSeriesSplit."""
    params = _decode(individual)
    model = SVR(
        kernel=params["kernel"],
        C=params["C"],
        epsilon=params["epsilon"],
        gamma=params["gamma"],
    )

    n = len(y)
    splits = int(max(2, min(cv_splits, n - 1)))
    tscv = TimeSeriesSplit(n_splits=splits)

    rmses: list[float] = []
    for train_idx, test_idx in tscv.split(X):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        if len(np.unique(y_tr)) < 2:
            # Degenerate fold; penalize lightly.
            return -1e9
        model.fit(X_tr, y_tr)
        pred = model.predict(X_te)
        rmses.append(_rmse(y_te, pred))

    return -float(np.mean(rmses))


def _tournament_select(
    rng: np.random.Generator, population: list[np.ndarray], fitnesses: list[float], k: int
) -> np.ndarray:
    idx = rng.choice(len(population), size=k, replace=False)
    best = max(idx, key=lambda i: fitnesses[i])
    return population[best].copy()


def _arithmetic_crossover(
    rng: np.random.Generator,
    p1: np.ndarray,
    p2: np.ndarray,
    *,
    crossover_rate: float,
) -> tuple[np.ndarray, np.ndarray]:
    if rng.random() < crossover_rate:
        alpha = rng.random()
        c1 = alpha * p1 + (1 - alpha) * p2
        c2 = alpha * p2 + (1 - alpha) * p1
        return c1, c2
    return p1.copy(), p2.copy()


def _gaussian_mutation(
    rng: np.random.Generator, individual: np.ndarray, *, mutation_rate: float
) -> np.ndarray:
    mutant = individual.copy()
    bounds = [PARAM_BOUNDS["C"], PARAM_BOUNDS["epsilon"], PARAM_BOUNDS["gamma"]]

    for i, (low, high) in enumerate(bounds):
        if rng.random() < mutation_rate:
            sigma = (high - low) * 0.05
            mutant[i] += rng.normal(0, sigma)
            mutant[i] = np.clip(mutant[i], low, high)

    return mutant


def run_ga_time_series(
    X: np.ndarray,
    y: np.ndarray,
    *,
    config: dict | None = None,
    verbose: bool = True,
) -> dict:
    """Run GA to find best SVR params for forecasting on time series."""

    cfg = {**DEFAULT_GA_CONFIG, **(config or {})}
    rng = np.random.default_rng(int(cfg["random_seed"]))

    pop_size = int(cfg["population_size"])
    n_gen = int(cfg["n_generations"])
    tournament_size = int(cfg["tournament_size"])
    crossover_rate = float(cfg["crossover_rate"])
    mutation_rate = float(cfg["mutation_rate"])
    cv_splits = int(cfg["cv_splits"])

    population = [_random_individual(rng) for _ in range(pop_size)]

    best_individual: np.ndarray | None = None
    best_fitness = -np.inf

    for gen in range(n_gen):
        fitnesses = [
            _fitness_ts(ind, X, y, cv_splits=cv_splits) for ind in population
        ]

        gen_best_idx = int(np.argmax(fitnesses))
        if fitnesses[gen_best_idx] > best_fitness:
            best_fitness = float(fitnesses[gen_best_idx])
            best_individual = population[gen_best_idx].copy()

        if verbose and (gen % 5 == 0 or gen == n_gen - 1):
            params = _decode(best_individual)
            print(
                f"  Gen {gen+1:3d}/{n_gen} | "
                f"Best RMSE: {-best_fitness:.4f} | "
                f"C={params['C']:.2f}, eps={params['epsilon']:.4f}, gamma={params['gamma']:.4f}"
            )

        new_population: list[np.ndarray] = [best_individual.copy()]  # elitism

        while len(new_population) < pop_size:
            p1 = _tournament_select(rng, population, fitnesses, tournament_size)
            p2 = _tournament_select(rng, population, fitnesses, tournament_size)
            c1, c2 = _arithmetic_crossover(rng, p1, p2, crossover_rate=crossover_rate)
            c1 = _gaussian_mutation(rng, c1, mutation_rate=mutation_rate)
            c2 = _gaussian_mutation(rng, c2, mutation_rate=mutation_rate)
            new_population.extend([c1, c2])

        population = new_population[:pop_size]

    if best_individual is None:
        raise ValueError("GA failed to find best individual")

    return _decode(best_individual)
