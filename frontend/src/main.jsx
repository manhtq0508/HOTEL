import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

//test page Bookings

// import React from "react";
// import ReactDOM from "react-dom/client";
// // import { BrowserRouter } from "react-router-dom";
// import Bookings from "./pages/Bookings.jsx";
// import "./index.css";
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     {/* Bỏ BrowserRouter, App đi, render thẳng Bookings */}
//     <Bookings />
//   </React.StrictMode>
// );
