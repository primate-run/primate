import ts from "typescript";

const factory = ts.factory;
const CORE_NS = "__primate_angular_core";

function TRUE() {
  return factory.createTrue();
}

function UNDEFINED() {
  return factory.createIdentifier("undefined");
}

function STRING_LITERAL(text: string) {
  return factory.createStringLiteral(text);
}

function core(name: string) {
  return factory.createPropertyAccessExpression(
    factory.createIdentifier(CORE_NS),
    name,
  );
}

function is_angular_core_import(node: ts.Node): node is ts.ImportDeclaration {
  return ts.isImportDeclaration(node)
    && ts.isStringLiteral(node.moduleSpecifier)
    && node.moduleSpecifier.text === "@angular/core";
}

function import_name(node: ts.ImportSpecifier) {
  return (node.propertyName ?? node.name).text;
}

function local_name(node: ts.ImportSpecifier) {
  return node.name.text;
}

type AngularCoreRefs = {
  input_names: Set<string>;
  namespaces: Set<string>;
};

function collect_angular_core_refs(source: ts.SourceFile): AngularCoreRefs {
  const input_names = new Set<string>(["input"]);
  const namespaces = new Set<string>();

  for (const statement of source.statements) {
    if (!is_angular_core_import(statement)) continue;

    const bindings = statement.importClause?.namedBindings;
    if (bindings === undefined) continue;

    if (ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (import_name(element) === "input") {
          input_names.add(local_name(element));
        }
      }
    }

    if (ts.isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text);
    }
  }

  return { input_names, namespaces };
}

function is_input_identifier_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return ts.isCallExpression(expr)
    && ts.isIdentifier(expr.expression)
    && refs.input_names.has(expr.expression.text);
}

function is_input_namespace_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return ts.isCallExpression(expr)
    && ts.isPropertyAccessExpression(expr.expression)
    && expr.expression.name.text === "input"
    && ts.isIdentifier(expr.expression.expression)
    && refs.namespaces.has(expr.expression.expression.text);
}

function is_input_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return is_input_identifier_call(expr, refs)
    || is_input_namespace_call(expr, refs);
}

function is_required_input_identifier_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return ts.isCallExpression(expr)
    && ts.isPropertyAccessExpression(expr.expression)
    && expr.expression.name.text === "required"
    && ts.isIdentifier(expr.expression.expression)
    && refs.input_names.has(expr.expression.expression.text);
}

function is_required_input_namespace_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return ts.isCallExpression(expr)
    && ts.isPropertyAccessExpression(expr.expression)
    && expr.expression.name.text === "required"
    && ts.isPropertyAccessExpression(expr.expression.expression)
    && expr.expression.expression.name.text === "input"
    && ts.isIdentifier(expr.expression.expression.expression)
    && refs.namespaces.has(expr.expression.expression.expression.text);
}

function is_required_input_call(
  expr: ts.Expression,
  refs: AngularCoreRefs,
): expr is ts.CallExpression {
  return is_required_input_identifier_call(expr, refs)
    || is_required_input_namespace_call(expr, refs);
}

function has_object_key(object: ts.ObjectLiteralExpression, key: string) {
  return object.properties.some(property =>
    ts.isPropertyAssignment(property)
    && (
      ts.isIdentifier(property.name) && property.name.text === key
      || ts.isStringLiteral(property.name) && property.name.text === key
    ),
  );
}

function input_decorator_arg(
  public_name: string,
  options: ts.Expression | undefined,
  required: boolean,
) {
  if (options === undefined) {
    if (!required) return factory.createStringLiteral(public_name);

    return factory.createObjectLiteralExpression([
      factory.createPropertyAssignment("alias", STRING_LITERAL(public_name)),
      factory.createPropertyAssignment("required", TRUE()),
    ], false);
  }

  if (ts.isObjectLiteralExpression(options)) {
    const props = [...options.properties];

    if (!has_object_key(options, "alias")) {
      props.push(
        factory.createPropertyAssignment("alias", STRING_LITERAL(public_name)),
      );
    }

    if (required && !has_object_key(options, "required")) {
      props.push(factory.createPropertyAssignment("required", TRUE()));
    }

    return factory.createObjectLiteralExpression(props, false);
  }

  return factory.createObjectLiteralExpression([
    factory.createSpreadAssignment(options),
    factory.createPropertyAssignment("alias", STRING_LITERAL(public_name)),
    ...(required
      ? [factory.createPropertyAssignment("required", TRUE())]
      : []),
  ], false);
}

function has_primate_core_namespace_import(source: ts.SourceFile) {
  return source.statements.some(statement => {
    if (!is_angular_core_import(statement)) return false;

    const bindings = statement.importClause?.namedBindings;
    return bindings !== undefined
      && ts.isNamespaceImport(bindings)
      && bindings.name.text === CORE_NS;
  });
}

function ensure_primate_core_namespace_import(source: ts.SourceFile) {
  if (has_primate_core_namespace_import(source)) return source;

  const import_statement = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamespaceImport(factory.createIdentifier(CORE_NS)),
    ),
    factory.createStringLiteral("@angular/core"),
  );

  return factory.updateSourceFile(source, [
    import_statement,
    ...source.statements,
  ]);
}

function transform_class_member(
  member: ts.ClassElement,
  refs: AngularCoreRefs,
): ts.ClassElement[] {
  if (
    !ts.isPropertyDeclaration(member)
    || member.initializer === undefined
    || !ts.isIdentifier(member.name)
  ) {
    return [member];
  }

  const name = member.name.text;
  const initializer = member.initializer;

  const regular = is_input_call(initializer, refs);
  const required = is_required_input_call(initializer, refs);

  if (!regular && !required) return [member];

  const args = initializer.arguments;

  const default_value = regular
    ? args[0] ?? UNDEFINED()
    : factory.createNonNullExpression(UNDEFINED());

  const options = regular ? args[1] : args[0];

  const signal_call = factory.createCallExpression(
    core("signal"),
    initializer.typeArguments,
    [default_value],
  );

  const signal_property = factory.updatePropertyDeclaration(
    member,
    member.modifiers,
    member.name,
    member.questionToken,
    member.type,
    signal_call,
  );

  const decorator = factory.createDecorator(
    factory.createCallExpression(
      core("Input"),
      undefined,
      [input_decorator_arg(name, options, required)],
    ),
  );

  const setter = factory.createSetAccessorDeclaration(
    [decorator],
    factory.createIdentifier(`__primate_input_${name}`),
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        "value",
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      ),
    ],
    factory.createBlock([
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createThis(),
              name,
            ),
            "set",
          ),
          undefined,
          [factory.createIdentifier("value")],
        ),
      ),
    ], true),
  );

  return [signal_property, setter];
}

function transform_source(source: ts.SourceFile) {
  const refs = collect_angular_core_refs(source);
  let found = false;

  const statements = source.statements.map(statement => {
    if (!ts.isClassDeclaration(statement)) return statement;

    const members = statement.members.flatMap(member => {
      const next = transform_class_member(member, refs);

      if (next.length !== 1 || next[0] !== member) {
        found = true;
      }

      return next;
    });

    return factory.updateClassDeclaration(
      statement,
      statement.modifiers,
      statement.name,
      statement.typeParameters,
      statement.heritageClauses,
      members,
    );
  });

  if (!found) return source;

  return ensure_primate_core_namespace_import(
    factory.updateSourceFile(source, statements),
  );
}

export default function signal_inputs(text: string) {
  const source = ts.createSourceFile(
    "component.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const transformed = transform_source(source);

  if (transformed === source) return text;

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printNode(ts.EmitHint.SourceFile, transformed, source);
}
