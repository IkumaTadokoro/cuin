import { describe, expect, it } from "vitest";
import { getFileName } from "./get-file-name";

describe("getFileName", () => {
  it("絶対パスからファイル名を抽出", () => {
    expect(
      getFileName(
        "/Users/ikuma-tadokoro/src/github.com/IkumaTadokoro/cuin/packages/ui/src/routes/components/[id].tsx"
      )
    ).toBe("[id].tsx");
  });

  it("相対パスからファイル名を抽出", () => {
    expect(getFileName("src/components/Button.tsx")).toBe("Button.tsx");
  });

  it("ファイル名のみの場合はそのまま返す", () => {
    expect(getFileName("index.tsx")).toBe("index.tsx");
  });

  it("拡張子なしのファイル名", () => {
    expect(getFileName("path/to/README")).toBe("README");
  });

  it("複数のドットを含むファイル名", () => {
    expect(getFileName("path/to/component.test.tsx")).toBe(
      "component.test.tsx"
    );
  });

  it("空文字列の場合は空文字列を返す", () => {
    expect(getFileName("")).toBe("");
  });

  it("末尾がスラッシュの場合は空文字列を返す", () => {
    expect(getFileName("path/to/directory/")).toBe("");
  });

  it("Windowsスタイルのパス（バックスラッシュ）は処理しない", () => {
    expect(getFileName("C:\\Users\\test\\file.txt")).toBe(
      "C:\\Users\\test\\file.txt"
    );
  });
});
