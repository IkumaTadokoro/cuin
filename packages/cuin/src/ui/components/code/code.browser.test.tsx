import { render } from "@solidjs/testing-library";
import { test } from "vitest";
import { Code } from "./code";

test("Show code block", async () => {
  const props = {
    code: '<Button variant="outline" className="w-full">\n  <svg\n    className="mr-2 h-4 w-4"\n    fill="currentColor"\n    viewBox="0 0 24 24"\n  >\n    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />\n  </svg>\n  Continue with Facebook\n</Button>',
    basePath: "path/to/base",
    filePath: "path/to/code.tsx",
    span: {
      start: 0,
      end: 29,
      startLine: 99,
      startCol: 12,
      endLine: 108,
      endCol: 30,
    },
  };
  const { findByRole } = render(() => <Code {...props} />);
  await findByRole("code");
});
