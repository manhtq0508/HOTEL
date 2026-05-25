"""
Genetic Algorithm để optimize SVR hyperparameters.
Optimize 3 params: C, epsilon, gamma
Theo paper: dùng real-valued encoding, tournament selection,
            arithmetic crossover, gaussian mutation
"""
from datetime import datetime
import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.svm import SVR


# ─── Search space cho từng param ───────────────────────────────────────────
PARAM_BOUNDS = {
    "C":       (0.1,  1000.0),
    "epsilon": (0.001, 1.0),
    "gamma":   (0.0001, 10.0),
}

# ─── GA Hyperparameters (theo paper) ───────────────────────────────────────
GA_CONFIG = {
    "population_size": 20,
    "n_generations":   50,
    "crossover_rate":  0.8,
    "mutation_rate":   0.1,
    "tournament_size": 3,
    "cv_folds":        3,    # cross-validation folds để đánh giá fitness
    "random_seed":     42,
}


# ─── Encode / Decode ────────────────────────────────────────────────────────

def _random_individual() -> np.ndarray:
    """Tạo 1 individual ngẫu nhiên: [C, epsilon, gamma]"""
    return np.array([
        np.random.uniform(*PARAM_BOUNDS["C"]),
        np.random.uniform(*PARAM_BOUNDS["epsilon"]),
        np.random.uniform(*PARAM_BOUNDS["gamma"]),
    ])


def _decode(individual: np.ndarray) -> dict:
    """Chuyển array → dict params cho SVR"""
    return {
        "C":       float(np.clip(individual[0], *PARAM_BOUNDS["C"])),
        "epsilon": float(np.clip(individual[1], *PARAM_BOUNDS["epsilon"])),
        "gamma":   float(np.clip(individual[2], *PARAM_BOUNDS["gamma"])),
        "kernel":  "rbf",
    }


# ─── Fitness ────────────────────────────────────────────────────────────────

def _fitness(individual: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
    """
    Fitness = negative RMSE (cross-validation).
    GA maximize fitness → minimize RMSE.
    """
    params = _decode(individual)
    model = SVR(
        kernel=params["kernel"],
        C=params["C"],
        epsilon=params["epsilon"],
        gamma=params["gamma"],
    )

    # Dùng cross-validation để tránh overfitting khi chọn params
    n_folds = min(GA_CONFIG["cv_folds"], len(y))
    scores = cross_val_score(
        model, X, y,
        cv=n_folds,
        scoring="neg_root_mean_squared_error"
    )
    return float(np.mean(scores))  # âm RMSE, càng cao càng tốt


# ─── Selection ──────────────────────────────────────────────────────────────

def _tournament_select(population: list, fitnesses: list) -> np.ndarray:
    """Tournament selection: chọn ngẫu nhiên k cá thể, lấy cái tốt nhất."""
    k = GA_CONFIG["tournament_size"]
    idx = np.random.choice(len(population), size=k, replace=False)
    best = max(idx, key=lambda i: fitnesses[i])
    return population[best].copy()


# ─── Crossover ──────────────────────────────────────────────────────────────

def _arithmetic_crossover(p1: np.ndarray, p2: np.ndarray) -> tuple:
    """Arithmetic crossover: con = alpha*p1 + (1-alpha)*p2"""
    if np.random.rand() < GA_CONFIG["crossover_rate"]:
        alpha = np.random.rand()
        c1 = alpha * p1 + (1 - alpha) * p2
        c2 = alpha * p2 + (1 - alpha) * p1
        return c1, c2
    return p1.copy(), p2.copy()


# ─── Mutation ───────────────────────────────────────────────────────────────

def _gaussian_mutation(individual: np.ndarray) -> np.ndarray:
    """Gaussian mutation: thêm noise nhỏ vào từng gene."""
    mutant = individual.copy()
    bounds = [PARAM_BOUNDS["C"], PARAM_BOUNDS["epsilon"], PARAM_BOUNDS["gamma"]]

    for i, (low, high) in enumerate(bounds):
        if np.random.rand() < GA_CONFIG["mutation_rate"]:
            sigma = (high - low) * 0.05   # 5% của range
            mutant[i] += np.random.normal(0, sigma)
            mutant[i] = np.clip(mutant[i], low, high)

    return mutant


# ─── Main GA ────────────────────────────────────────────────────────────────

def run_ga(X: np.ndarray, y: np.ndarray, verbose: bool = True) -> dict:
    """
    Chạy Genetic Algorithm để tìm params tối ưu cho SVR.

    Args:
        X: features đã normalized
        y: target values
        verbose: in progress mỗi 10 generation

    Returns:
        best_params: dict {C, epsilon, gamma, kernel}
    """
    seed = int(datetime.now().timestamp()) % 100000
    np.random.seed(seed)
    pop_size = GA_CONFIG["population_size"]
    n_gen = GA_CONFIG["n_generations"]

    # 1. Khởi tạo population
    population = [_random_individual() for _ in range(pop_size)]

    best_individual = None
    best_fitness = -np.inf

    for gen in range(n_gen):
        # 2. Tính fitness cho toàn bộ population
        fitnesses = [_fitness(ind, X, y) for ind in population]

        # 3. Cập nhật best
        gen_best_idx = np.argmax(fitnesses)
        if fitnesses[gen_best_idx] > best_fitness:
            best_fitness = fitnesses[gen_best_idx]
            best_individual = population[gen_best_idx].copy()

        if verbose and (gen % 10 == 0 or gen == n_gen - 1):
            params = _decode(best_individual)
            print(
                f"  Gen {gen+1:3d}/{n_gen} | "
                f"Best RMSE: {-best_fitness:.4f} | "
                f"C={params['C']:.2f}, "
                f"eps={params['epsilon']:.4f}, "
                f"gamma={params['gamma']:.4f}"
            )

        # 4. Tạo thế hệ mới
        new_population = [best_individual.copy()]  # Elitism: giữ best

        while len(new_population) < pop_size:
            p1 = _tournament_select(population, fitnesses)
            p2 = _tournament_select(population, fitnesses)
            c1, c2 = _arithmetic_crossover(p1, p2)
            c1 = _gaussian_mutation(c1)
            c2 = _gaussian_mutation(c2)
            new_population.extend([c1, c2])

        population = new_population[:pop_size]

    best_params = _decode(best_individual)

    if verbose:
        print(f"\n[GA] Tối ưu xong!")
        print(f"     C       = {best_params['C']:.4f}")
        print(f"     epsilon = {best_params['epsilon']:.4f}")
        print(f"     gamma   = {best_params['gamma']:.4f}")
        print(f"     RMSE    = {-best_fitness:.4f}")

    return best_params