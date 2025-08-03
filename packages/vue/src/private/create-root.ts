export default () => `
  import { h, defineComponent } from "vue";

  export default (component, props) => {
    return defineComponent({
      name: "root",
      setup() {
        return () => h("div", { id: "app" }, [h(component, props.props)]);
      },
    });
  };
`;
