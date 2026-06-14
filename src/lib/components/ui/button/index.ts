import Root from "./button.svelte";

export {
	Root,
	type ComponentProps,
	//
	Root as Button,
};

type ComponentProps = import('svelte').ComponentProps<typeof Root>;
