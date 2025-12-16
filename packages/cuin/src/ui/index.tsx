/* @refresh reload */
import { render } from "solid-js/web";
import App from "./app";

const root = document.getElementById("app");
if (root) {
  render(() => <App />, root);
}
