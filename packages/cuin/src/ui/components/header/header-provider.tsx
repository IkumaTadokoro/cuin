import {
  type Accessor,
  createContext,
  createSignal,
  type JSX,
  type ParentProps,
  type Setter,
  useContext,
} from "solid-js";

type HeaderConfig = {
  breadcrumbs: string[];
  title: {
    icon?: JSX.Element;
    text: string;
  };
  description?: string | JSX.Element;
};

type HeaderContextType = {
  config: Accessor<HeaderConfig>;
  setConfig: Setter<HeaderConfig>;
};

const defaultConfig: HeaderConfig = {
  breadcrumbs: ["cuin"],
  title: {
    icon: undefined,
    text: "",
  },
};

const HeaderContext = createContext<HeaderContextType>();

export function HeaderProvider(props: ParentProps) {
  const [config, setConfig] = createSignal<HeaderConfig>(defaultConfig);

  return (
    <HeaderContext.Provider value={{ config, setConfig }}>
      {props.children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }

  const setHeader = (config: HeaderConfig | (() => HeaderConfig)) => {
    const resolvedConfig = typeof config === "function" ? config() : config;
    context.setConfig(resolvedConfig);
  };

  return {
    header: context.config,
    setHeader,
  };
}
