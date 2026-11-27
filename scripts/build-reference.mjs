import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanBlockComment, commentsIn } from '../../searsuite/scripts/source-comments.mjs';
import { marked } from 'marked';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = resolve(root, '../searsuite');
const packageRoots = [coreRoot, resolve(root, '../searsuite-browser')];
const sourceRoot = resolve(root, 'source');
const reflection = JSON.parse(readFileSync(resolve(root, '.generated/typedoc.json'), 'utf8'));
const sourcePath = (fileName) => fileName.replace(/^searsuite(?:-browser)?\//, '');
const resolveSourceFile = (fileName) => packageRoots.map((packageRoot) => resolve(packageRoot, sourcePath(fileName))).find(existsSync);
const resolvePackageFile = (directory, fileName) => packageRoots
  .map((packageRoot) => resolve(packageRoot, 'packages', directory, fileName))
  .find(existsSync);

const reflectionsById = new Map();

function indexReflections(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.id === 'number') reflectionsById.set(value.id, value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(indexReflections);
    else if (child && typeof child === 'object') indexReflections(child);
  }
}

indexReflections(reflection);

function resolveDeclaration(declaration) {
  if (declaration.kind !== 4194304 || typeof declaration.target !== 'number') return declaration;
  return reflectionsById.get(declaration.target) ?? declaration;
}

const kindNames = new Map([
  [4, 'namespace'],
  [8, 'enum'],
  [16, 'enum member'],
  [32, 'variable'],
  [64, 'function'],
  [128, 'class'],
  [256, 'interface'],
  [512, 'constructor'],
  [1024, 'property'],
  [2048, 'method'],
  [262144, 'accessor'],
  [4194304, 'reference'],
  [2097152, 'type'],
]);

function commentText(parts = []) {
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

function documentationOf(...reflections) {
  const comments = reflections.flatMap((item) => (item?.comment ? [item.comment] : []));
  const summary = comments.map((comment) => commentText(comment.summary)).find(Boolean) ?? '';
  const blocks = comments.flatMap((comment) => comment.blockTags ?? []);
  const readBlocks = (tag) => [
    ...new Set(blocks.filter((block) => block.tag === tag).map((block) => commentText(block.content))),
  ];
  return {
    deprecated: readBlocks('@deprecated')[0] ?? '',
    examples: readBlocks('@example'),
    remarks: readBlocks('@remarks').join('\n\n'),
    returns: readBlocks('@returns')[0] ?? '',
    summary,
    throws: readBlocks('@throws'),
  };
}

const publicDeclarationIdsBySource = new Map();
for (const moduleReflection of reflection.children ?? []) {
  for (const declaration of moduleReflection.children ?? []) {
    const resolvedDeclaration = resolveDeclaration(declaration);
    const source = resolvedDeclaration.sources?.[0]?.fileName;
    if (!source) continue;
    const ids = publicDeclarationIdsBySource.get(source) ?? new Set();
    ids.add(resolvedDeclaration.id);
    publicDeclarationIdsBySource.set(source, ids);
  }
}

const sourceDocumentationCache = new Map();

function sourceDocumentationOf(reflectionItem) {
  const source = reflectionItem?.sources?.[0];
  const publicIds = source ? publicDeclarationIdsBySource.get(source.fileName) : null;
  if (!source || publicIds?.size !== 1 || !publicIds.has(reflectionItem.id)) return null;
  const cacheKey = `${source.fileName}:${reflectionItem.id}`;
  if (sourceDocumentationCache.has(cacheKey)) return sourceDocumentationCache.get(cacheKey);

  const file = resolveSourceFile(source.fileName);
  if (!file) throw new Error(`Cannot locate TypeDoc source file ${source.fileName}.`);
  const candidate = commentsIn(file)
    .filter(
      (comment) =>
        comment.line <= source.line &&
        comment.text.startsWith('/**') &&
        !/@(?:packageDocumentation|guideChapter|license)\b/.test(comment.text),
    )
    .at(-1);
  if (!candidate) {
    sourceDocumentationCache.set(cacheKey, null);
    return null;
  }

  const lines = cleanBlockComment(candidate.text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const exampleIndex = lines.findIndex((line) => /^Example:/i.test(line));
  const summaryLines = lines.filter((line, index) => !line.startsWith('@') && index !== exampleIndex);
  const documentation = {
    deprecated: '',
    examples: exampleIndex >= 0 ? [lines[exampleIndex].replace(/^Example:\s*/i, '')] : [],
    remarks: '',
    returns: '',
    summary: summaryLines.join(' '),
    throws: [],
  };
  sourceDocumentationCache.set(cacheKey, documentation.summary ? documentation : null);
  return documentation.summary ? documentation : null;
}

function documentationFor(reflectionItem, ...related) {
  const documentation = documentationOf(
    reflectionItem,
    reflectionItem?.getSignature,
    reflectionItem?.setSignature,
    ...related,
  );
  if (documentation.summary) return documentation;
  const inheritedTarget = reflectionItem?.inheritedFrom?.target;
  if (typeof inheritedTarget === 'number') {
    const inheritedReflection = reflectionsById.get(inheritedTarget);
    const inheritedDocumentation = inheritedReflection ? documentationOf(inheritedReflection, inheritedReflection.getSignature, inheritedReflection.setSignature) : null;
    if (inheritedDocumentation?.summary) return inheritedDocumentation;
  }
  return sourceDocumentationOf(reflectionItem) ?? documentation;
}

const formulaIntroCache = new Map();
function formulaDocumentationFor(sourcePath, name) {
  if (!/packages\/sear-(?:domain-formula-engine-ts|plugin-formula-engineering)\/src\//.test(sourcePath)) return null;
  const file = resolveSourceFile(sourcePath);
  if (!file) return null;
  if (!formulaIntroCache.has(file)) {
    const first = commentsIn(file).find((comment) => comment.text.startsWith('/**'));
    formulaIntroCache.set(file, first ? cleanBlockComment(first.text) : '');
  }
  const lines = formulaIntroCache
    .get(file)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const summary = lines[0]?.toLowerCase().startsWith(`${name.toLowerCase()}:`)
    ? lines[0].slice(name.length + 1).trim()
    : '';
  if (!summary) return null;
  const example = lines.find((line) => /^Example:/i.test(line))?.replace(/^Example:\s*/i, '');
  return {
    deprecated: '',
    examples: example ? [example] : [],
    remarks: '',
    returns: '',
    summary,
    throws: [],
  };
}

function documentedParameters(signatures = []) {
  const parameters = new Map();
  for (const signature of signatures) {
    for (const parameter of signature.parameters ?? []) {
      const description = documentationOf(parameter).summary;
      if (!parameters.has(parameter.name) || description) {
        parameters.set(parameter.name, {
          description,
          name: parameter.name,
          type: renderType(parameter.type),
        });
      }
    }
  }
  return [...parameters.values()];
}

function renderType(type, depth = 0) {
  if (!type) return 'unknown';
  switch (type.type) {
    case 'intrinsic':
    case 'reference':
      return `${type.name ?? 'unknown'}${
        type.typeArguments?.length
          ? `<${type.typeArguments.map((item) => renderType(item, depth + 1)).join(', ')}>`
          : ''
      }`;
    case 'array':
      return `${renderType(type.elementType, depth + 1)}[]`;
    case 'union':
      return (type.types ?? []).map((item) => renderType(item, depth + 1)).join(' | ') || 'unknown';
    case 'intersection':
      return (type.types ?? []).map((item) => renderType(item, depth + 1)).join(' & ') || 'unknown';
    case 'literal':
      return typeof type.value === 'string' ? JSON.stringify(type.value) : String(type.value);
    case 'tuple':
      return `[${(type.elements ?? []).map((item) => renderType(item, depth + 1)).join(', ')}]`;
    case 'namedTupleMember':
      return `${type.name}${type.isOptional ? '?' : ''}: ${renderType(type.element, depth + 1)}`;
    case 'typeOperator':
      return `${type.operator} ${renderType(type.target, depth + 1)}`;
    case 'query':
      return `typeof ${renderType(type.queryType, depth + 1)}`;
    case 'optional':
      return `${renderType(type.elementType, depth + 1)} | undefined`;
    case 'rest':
      return `...${renderType(type.elementType, depth + 1)}`;
    case 'indexedAccess':
      return `${renderType(type.objectType, depth + 1)}[${renderType(type.indexType, depth + 1)}]`;
    case 'reflection': {
      const declaration = type.declaration ?? {};
      const signatures = declaration.signatures ?? [];
      const fields = declaration.children ?? [];
      const indexes = declaration.indexSignatures ?? [];
      if (signatures.length === 1 && !fields.length && !indexes.length) {
        return renderCallable(signatures[0], depth + 1, false);
      }
      const entries = [
        ...signatures.map((signature) => renderCallable(signature, depth + 1, false)),
        ...indexes.map((index) => `${index.flags?.isReadonly ? 'readonly ' : ''}[${renderParameters(index.parameters, depth + 1)}]: ${renderType(index.type, depth + 1)}`),
        ...fields.flatMap((field) => field.signatures?.length
          ? field.signatures.map((signature) => renderCallable(signature, depth + 1))
          : [`${field.flags?.isReadonly ? 'readonly ' : ''}${field.name}${field.flags?.isOptional ? '?' : ''}: ${renderType(field.type ?? field.getSignature?.type, depth + 1)}`]),
      ];
      if (!entries.length) return '{}';
      if (entries.length === 1 && !entries[0].includes('\n') && entries[0].length <= 80) {
        return `{ ${entries[0]} }`;
      }
      return `{\n${entries.map((entry) => `${'  '.repeat(depth + 1)}${entry}`).join(';\n')};\n${'  '.repeat(depth)}}`;
    }
    case 'unknown':
      return 'unknown';
    default:
      return type.name ?? type.type ?? 'unknown';
  }
}

function renderParameters(parameters = [], depth = 0) {
  return parameters
    .map((parameter) => {
      const prefix = parameter.flags?.isRest ? '...' : '';
      const optional = parameter.flags?.isOptional || parameter.defaultValue !== undefined ? '?' : '';
      return `${prefix}${parameter.name}${optional}: ${renderType(parameter.type, depth + 1)}`;
    })
    .join(', ');
}

function renderCallable(signature, depth = 0, named = true) {
  const generics = signature.typeParameters?.length
    ? `<${signature.typeParameters.map((parameter) => parameter.name).join(', ')}>`
    : '';
  const name = named ? `${signature.name}${generics}` : generics;
  return `${name}(${renderParameters(signature.parameters, depth + 1)}): ${renderType(signature.type, depth + 1)}`;
}

function renderDeclaration(declaration) {
  const kind = kindNames.get(declaration.kind) ?? 'export';
  if (declaration.signatures?.length) {
    return declaration.signatures.map((signature) => renderCallable(signature));
  }
  if (kind === 'class' || kind === 'interface') {
    const generics = declaration.typeParameters?.length
      ? `<${declaration.typeParameters.map((parameter) => parameter.name).join(', ')}>`
      : '';
    const parents = [...(declaration.extendedTypes ?? []), ...(declaration.implementedTypes ?? [])];
    return [
      `${kind} ${declaration.name}${generics}${
        parents.length ? ` extends ${parents.map((item) => renderType(item)).join(', ')}` : ''
      }`,
    ];
  }
  if (kind === 'type') return [`type ${declaration.name} = ${renderType(declaration.type)}`];
  if (kind === 'enum') return [`enum ${declaration.name}`];
  return [`${declaration.name}: ${renderType(declaration.type)}`];
}

function renderMemberSignatures(member) {
  if (member.signatures?.length) {
    return member.signatures.map((signature) => renderCallable(signature));
  }
  const prefix = member.flags?.isReadonly ? 'readonly ' : '';
  const optional = member.flags?.isOptional ? '?' : '';
  const type = member.type ?? member.getSignature?.type ?? member.setSignature?.parameters?.[0]?.type;
  return [`${prefix}${member.name}${optional}: ${renderType(type)}`];
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/^@searsuite\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function renderDocMarkdown(value) {
  return marked.parse(escapeHtml(value)).trim();
}

function renderDocInline(value) {
  return marked.parseInline(escapeHtml(value)).trim();
}

function isBoilerplateSummary(value) {
  return /^(?:Public contract for .+|Type contract for .+|Returns the value\.|Runs the .+ helper\.|Creates? (?:a|an) .+ instance\.)$/i.test(
    value.trim(),
  );
}

function renderDocumentation(documentation, className = 'reference-documentation') {
  if (!documentation) return '';
  const sections = [
    documentation.deprecated
      ? `<aside class="reference-deprecated"><strong>Deprecated</strong> ${renderDocInline(
          documentation.deprecated,
        )}</aside>`
      : '',
    documentation.summary && !isBoilerplateSummary(documentation.summary)
      ? renderDocMarkdown(documentation.summary)
      : '',
    documentation.remarks ? `<div class="reference-remarks">${renderDocMarkdown(documentation.remarks)}</div>` : '',
    documentation.returns
      ? `<p class="reference-tag"><strong>Returns</strong><span>${renderDocInline(documentation.returns)}</span></p>`
      : '',
    ...documentation.throws.map(
      (description) =>
        `<p class="reference-tag"><strong>Throws</strong><span>${renderDocInline(description)}</span></p>`,
    ),
    ...documentation.examples.map((example) => {
      const code = example
        .replace(/^```(?:ts|typescript|js|javascript)?\s*/i, '')
        .replace(/```$/, '')
        .trim();
      return `<div class="reference-example"><strong>Example</strong><pre><code>${escapeHtml(code)}</code></pre></div>`;
    }),
  ].filter(Boolean);
  return sections.length ? `<div class="${className}">${sections.join('\n')}</div>` : '';
}

function renderParameterDocumentation(parameters) {
  const described = parameters.filter((parameter) => parameter.description);
  if (!described.length) return '';
  return `<dl class="reference-parameters">${described
    .map(
      (parameter) =>
        `<div><dt><code>${escapeHtml(parameter.name)}</code></dt><dd>${renderDocMarkdown(
          parameter.description,
        )}</dd></div>`,
    )
    .join('\n')}</dl>`;
}

function assertDocumentationCoverage() {
  const declarations = (reflection.children ?? []).flatMap((moduleReflection) => moduleReflection.children ?? []);
  const resolvedDeclarations = declarations.map(resolveDeclaration);
  const members = resolvedDeclarations.flatMap((declaration) => declaration.children ?? []);
  const documented = (items) =>
    items.filter((item) => documentationFor(item, ...(item.signatures ?? [])).summary).length;
  const declarationCoverage = resolvedDeclarations.length
    ? documented(resolvedDeclarations) / resolvedDeclarations.length
    : 1;
  const memberCoverage = members.length ? documented(members) / members.length : 1;
  const percentage = (value) => `${(value * 100).toFixed(1)}%`;

  if (declarationCoverage < 0.9 || memberCoverage < 0.68) {
    throw new Error(
      `Public API documentation coverage fell below the required baseline: declarations ${percentage(
        declarationCoverage,
      )}, members ${percentage(memberCoverage)}.`,
    );
  }
  return { declarationCoverage, memberCoverage };
}

const documentationCoverage = assertDocumentationCoverage();

function referenceChaptersFor(directory) {
  const source = resolvePackageFile(directory, 'src/index.ts');
  if (!source) return [];
  const chapters = [];
  for (const comment of commentsIn(source)) {
    const text = cleanBlockComment(comment.text);
    const heading = text.match(/^@referenceChapter\s+(\d+)\s+([a-z0-9-]+)\s+(.+)$/m);
    if (!heading) continue;
    const body = text.match(/^@referenceBody\s*\n([\s\S]*)$/m)?.[1]?.trim();
    if (!body) throw new Error(`${source} contains an incomplete @referenceChapter comment.`);
    chapters.push({ order: Number(heading[1]), slug: heading[2], title: heading[3].trim(), body });
  }
  chapters.sort((left, right) => left.order - right.order);
  if (new Set(chapters.map((chapter) => chapter.slug)).size !== chapters.length) {
    throw new Error(`${source} contains duplicate @referenceChapter slugs.`);
  }
  return chapters;
}

const symbolKindPriority = new Map([
  ['class', 0],
  ['interface', 1],
  ['enum', 2],
  ['type', 3],
  ['function', 4],
  ['variable', 5],
  ['namespace', 6],
]);

function memberFromReflection(member) {
  return {
    documentation: documentationFor(member, ...(member.signatures ?? []), member.getSignature, member.setSignature),
    flags: {
      abstract: Boolean(member.flags?.isAbstract),
      readonly: Boolean(member.flags?.isReadonly),
      static: Boolean(member.flags?.isStatic),
    },
    kind: kindNames.get(member.kind) ?? 'member',
    name: member.name,
    parameters: documentedParameters(member.signatures),
    reflectionId: member.id,
    reflection: member,
    signatures: renderMemberSignatures(member),
  };
}

function enumLikeMembers(typeSymbol, variableSymbol) {
  if (typeSymbol.kind !== 'type' || variableSymbol.kind !== 'variable' ||
      !variableSymbol.reflection.flags?.isConst) return null;
  const alias = typeSymbol.reflection.type;
  if (alias?.type !== 'indexedAccess' ||
      alias.objectType?.queryType?.target !== variableSymbol.reflectionId ||
      alias.indexType?.operator !== 'keyof') return null;
  const fields = variableSymbol.reflection.type?.declaration?.children ?? [];
  if (!fields.length || !fields.every((field) => field.kind === 1024 &&
      field.flags?.isReadonly && field.type?.type === 'literal')) return null;
  return fields
    .slice()
    .sort((left, right) => (left.sources?.[0]?.line ?? 0) - (right.sources?.[0]?.line ?? 0))
    .map((field) => ({ ...memberFromReflection(field), kind: 'enum member' }));
}

function mergeDocumentedItems(left, right) {
  return {
    ...left,
    documentation: left.documentation.summary ? left.documentation : right.documentation,
    signatures: [...new Set([...left.signatures, ...right.signatures])],
    parameters: [...new Map([...left.parameters, ...right.parameters].map((item) => [item.name, item])).values()],
  };
}

function coalesceSymbols(symbols) {
  const byName = new Map();
  for (const symbol of symbols) {
    const existing = byName.get(symbol.name);
    if (!existing) {
      byName.set(symbol.name, symbol);
      continue;
    }
    const preferred =
      (symbolKindPriority.get(existing.kind) ?? 99) <= (symbolKindPriority.get(symbol.kind) ?? 99) ? existing : symbol;
    const secondary = preferred === existing ? symbol : existing;
    const enumMembers = enumLikeMembers(preferred, secondary);
    const members = new Map();
    for (const member of [...preferred.members, ...secondary.members]) {
      const key = `${member.name}:${member.kind}:${member.flags.static}`;
      const old = members.get(key);
      members.set(key, old ? mergeDocumentedItems(old, member) : member);
    }
    byName.set(symbol.name, {
      ...mergeDocumentedItems(preferred, secondary),
      kind: enumMembers ? 'enum-like' : preferred.kind,
      inheritedMembers: [...preferred.inheritedMembers, ...secondary.inheritedMembers],
      members: enumMembers ?? [...members.values()],
      objectMembers: !enumMembers && (preferred.objectMembers || secondary.objectMembers),
    });
  }
  return [...byName.values()];
}

function assignSymbolIds(symbols, packageId) {
  const used = new Set();
  for (const symbol of symbols) {
    const base = `api-${packageId}-${slug(symbol.name)}`;
    let id = base;
    for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
    used.add(id);
    symbol.id = id;
    symbol.href = `#${id}`;
    const memberIds = new Set();
    for (const member of symbol.members) {
      const memberBase = `${id}-${slug(member.name)}`;
      let memberId = memberBase;
      if (memberIds.has(memberId)) memberId = `${memberBase}-${member.flags.static ? 'static' : 'instance'}`;
      for (let suffix = 2; memberIds.has(memberId); suffix++) memberId = `${memberBase}-${suffix}`;
      memberIds.add(memberId);
      member.id = memberId;
    }
  }
  return symbols;
}

const packages = reflection.children.map((moduleReflection) => {
  const source = moduleReflection.sources?.[0]?.fileName ?? '';
  const directory = source.match(/packages\/(sear-[^/]+)/)?.[1] ?? moduleReflection.name.split('/')[0];
  const packageJson = JSON.parse(readFileSync(resolvePackageFile(directory, 'package.json'), 'utf8'));
  const name = packageJson.name;
  const description = documentationFor(moduleReflection).summary;
  if (!description) {
    throw new Error(`${name} must describe its public role with an @packageDocumentation comment.`);
  }
  const symbols = assignSymbolIds(
    coalesceSymbols(
      (moduleReflection.children ?? []).map((declaration) => {
        const resolvedDeclaration = resolveDeclaration(declaration);
        const sourcePath = resolvedDeclaration.sources?.[0]?.fileName ?? '';
        const documentation =
          formulaDocumentationFor(sourcePath, declaration.name) ??
          documentationFor(resolvedDeclaration, ...(resolvedDeclaration.signatures ?? []));
        const aliasOf = declaration.kind === 4194304 && declaration.name !== resolvedDeclaration.name
          ? resolvedDeclaration.name : null;
        const objectMembers = !aliasOf && resolvedDeclaration.kind === 32 &&
          resolvedDeclaration.type?.type === 'reflection' &&
          Boolean(resolvedDeclaration.type.declaration?.children?.length);
        const allMembers = objectMembers
          ? resolvedDeclaration.type.declaration.children
          : resolvedDeclaration.children ?? [];
        const members = allMembers
          .filter((member) => !member.flags?.isInherited && (member.kind !== 512 || member.sources?.length))
          .map(memberFromReflection);
        return {
          aliasOf,
          documentation,
          href: `#${slug(name)}-${slug(declaration.name)}`,
          id: `${slug(name)}-${slug(declaration.name)}`,
          inheritedMembers: allMembers
            .filter((member) => member.flags?.isInherited)
            .map((member) => ({
              name: member.name,
              inheritedFromId: member.inheritedFrom?.target,
              kind: kindNames.get(member.kind) ?? 'member',
              flags: { static: Boolean(member.flags?.isStatic) },
            })),
          kind: kindNames.get(resolvedDeclaration.kind) ?? 'export',
          abstract: Boolean(resolvedDeclaration.flags?.isAbstract),
          members,
          objectMembers,
          name: declaration.name,
          parameters: documentedParameters(resolvedDeclaration.signatures),
          reflection: resolvedDeclaration,
          reflectionId: resolvedDeclaration.id,
          parents: (resolvedDeclaration.extendedTypes ?? []).map((type) => ({
            name: type.name,
            package: type.package,
          })),
          signatures: renderDeclaration({ ...resolvedDeclaration, name: declaration.name }),
          sourcePath,
        };
      }),
    ),
    slug(name),
  );
  return {
    chapters: referenceChaptersFor(directory),
    description,
    id: slug(name),
    name,
    symbols,
  };
});

const visiblePackages = packages.filter((packageItem) => packageItem.symbols.length > 0);

const symbolByQualifiedName = new Map(
  visiblePackages.flatMap((packageItem) =>
    packageItem.symbols.map((symbol) => [`${packageItem.name}:${symbol.name}`, symbol]),
  ),
);
const symbolByReflectionId = new Map(
  visiblePackages.flatMap((packageItem) => packageItem.symbols.map((symbol) => [symbol.reflectionId, symbol])),
);

function renderReferenceType(type, packageItem, depth = 0) {
  if (!type || depth > 7) return 'unknown';
  const next = (child) => renderReferenceType(child, packageItem, depth + 1);
  switch (type.type) {
    case 'reference': {
      const name = escapeHtml(type.name ?? 'unknown');
      const target = !type.refersToTypeParameter &&
        (symbolByReflectionId.get(type.target) ??
          symbolByQualifiedName.get(`${type.package ?? packageItem.name}:${type.name}`));
      const label = target ? `<a class="reference-type-link" href="${target.href}">${name}</a>` : name;
      return `${label}${type.typeArguments?.length ? `&lt;${type.typeArguments.map(next).join(', ')}&gt;` : ''}`;
    }
    case 'array':
      return `${next(type.elementType)}[]`;
    case 'union':
    case 'intersection':
      return (type.types ?? []).map(next).join(type.type === 'union' ? ' | ' : ' &amp; ') || 'unknown';
    case 'tuple':
      return `[${(type.elements ?? []).map(next).join(', ')}]`;
    case 'namedTupleMember':
      return `${escapeHtml(type.name)}${type.isOptional ? '?' : ''}: ${next(type.element)}`;
    case 'typeOperator':
      return `${escapeHtml(type.operator)} ${next(type.target)}`;
    case 'query':
      return `typeof ${next(type.queryType)}`;
    case 'optional':
      return `${next(type.elementType)} | undefined`;
    case 'rest':
      return `...${next(type.elementType)}`;
    case 'indexedAccess':
      return `${next(type.objectType)}[${next(type.indexType)}]`;
    default:
      return escapeHtml(renderType(type, depth));
  }
}

function renderReferenceParameters(parameters = [], packageItem) {
  return parameters.map((parameter) => {
    const prefix = parameter.flags?.isRest ? '...' : '';
    const optional = parameter.flags?.isOptional || parameter.defaultValue !== undefined ? '?' : '';
    return `${prefix}${escapeHtml(parameter.name)}${optional}: ${renderReferenceType(parameter.type, packageItem)}`;
  }).join(', ');
}

function renderReferenceCallable(signature, packageItem, href) {
  const generics = signature.typeParameters?.length
    ? `&lt;${signature.typeParameters.map((parameter) => escapeHtml(parameter.name)).join(', ')}&gt;`
    : '';
  return `<a class="reference-signature-name" href="${href}">${escapeHtml(signature.name)}</a>${generics}(${renderReferenceParameters(signature.parameters, packageItem)}): ${renderReferenceType(signature.type, packageItem)}`;
}

function renderReferenceSymbolSignatures(symbol, packageItem) {
  const declaration = symbol.reflection;
  const target = symbol.aliasOf && symbolByQualifiedName.get(`${packageItem.name}:${symbol.aliasOf}`);
  if (target?.kind === 'enum-like' || target?.objectMembers) {
    const name = `<a class="reference-signature-name" href="${symbol.href}">${escapeHtml(symbol.name)}</a>`;
    const original = target
      ? `<a class="reference-type-link" href="${target.href}">${escapeHtml(symbol.aliasOf)}</a>`
      : escapeHtml(symbol.aliasOf);
    return [`alias ${name} = ${original}`];
  }
  if (declaration.signatures?.length) {
    return declaration.signatures.map((signature) => renderReferenceCallable(signature, packageItem, symbol.href));
  }
  const name = `<a class="reference-signature-name" href="${symbol.href}">${escapeHtml(symbol.name)}</a>`;
  const generics = declaration.typeParameters?.length
    ? `&lt;${declaration.typeParameters.map((parameter) => escapeHtml(parameter.name)).join(', ')}&gt;`
    : '';
  if (symbol.kind === 'class' || symbol.kind === 'interface') {
    const parents = [...(declaration.extendedTypes ?? []), ...(declaration.implementedTypes ?? [])];
    return [`${symbol.kind} ${name}${generics}${parents.length ? ` extends ${parents.map((type) => renderReferenceType(type, packageItem)).join(', ')}` : ''}`];
  }
  if (symbol.kind === 'type') return [`type ${name} = ${renderReferenceType(declaration.type, packageItem)}`];
  if (symbol.kind === 'enum') return [`enum ${name}`];
  return [`${name}: ${renderReferenceType(declaration.type, packageItem)}`];
}

function renderReferenceMemberSignatures(member, packageItem) {
  const reflection = member.reflection;
  const modifiers = `${member.flags.static ? 'static ' : ''}${member.flags.abstract ? 'abstract ' : ''}`;
  if (reflection.signatures?.length) {
    return reflection.signatures.map((signature) => `${modifiers}${renderReferenceCallable(signature, packageItem, `#${member.id}`)}`);
  }
  const name = `<a class="reference-signature-name" href="#${member.id}">${escapeHtml(member.name)}</a>`;
  const type = reflection.type ?? reflection.getSignature?.type ?? reflection.setSignature?.parameters?.[0]?.type;
  return [`${modifiers}${reflection.flags?.isReadonly ? 'readonly ' : ''}${name}${reflection.flags?.isOptional ? '?' : ''}: ${renderReferenceType(type, packageItem)}`];
}

function renderReferenceSignatures(signatures, originalSignatures) {
  const visible = signatures.length === originalSignatures.length
    ? signatures
    : originalSignatures.map(escapeHtml);
  return visible.map((signature) => `<code class="reference-signature">${signature}</code>`).join('\n');
}

const memberLinkByReflectionId = new Map();
for (const packageItem of packages) {
  for (const symbol of packageItem.symbols) {
    for (const member of symbol.members) {
      if (!memberLinkByReflectionId.has(member.reflectionId)) {
        memberLinkByReflectionId.set(member.reflectionId, `#${member.id}`);
      }
    }
  }
}

function inheritedMemberLink(member) {
  let sourceId = member.inheritedFromId;
  const seen = new Set();
  while (typeof sourceId === 'number' && !seen.has(sourceId)) {
    const link = memberLinkByReflectionId.get(sourceId);
    if (link) return link;
    seen.add(sourceId);
    sourceId = reflectionsById.get(sourceId)?.inheritedFrom?.target;
  }
  return null;
}

function renderInheritedMembers(symbol, packageItem) {
  const inheritedMembers = [
    ...new Map(
      symbol.inheritedMembers
        .filter((member) => !symbol.members.some((own) => own.name === member.name))
        .map((member) => [member.name, member]),
    ).values(),
  ];
  if (!inheritedMembers.length) return '';
  const parent = symbol.parents
    .map((type) => symbolByQualifiedName.get(`${type.package ?? packageItem.name}:${type.name}`))
    .find(Boolean);
  const parentLink = parent ? `<p>Inherited from <a href="${parent.href}">${escapeHtml(parent.name)}</a>.</p>` : '';
  const groups = memberGroups.map(([key, label]) => {
    const members = inheritedMembers.filter((member) => memberGroupFor(member, symbol) === key);
    if (!members.length) return '';
    const names = members.map((member) => {
      const target = inheritedMemberLink(member) ?? parent?.href ?? null;
      return `<li id="${symbol.id}-${slug(member.name)}">${
        target ? `<a href="${target}">${escapeHtml(member.name)}</a>` : escapeHtml(member.name)
      }</li>`;
    }).join('\n');
    return `<div class="reference-inherited-group"><h6>${label}</h6><ul>${names}</ul></div>`;
  }).join('\n');
  return `<details class="reference-inherited">
    <summary>Inherited <span>(${inheritedMembers.length})</span></summary>
    ${parentLink}
    ${groups}
  </details>`;
}

const navigationGroups = [
  {
    label: 'Assembly',
    summary: 'Create editors, configure their capabilities, and connect a host.',
    chapter: 'editors',
    entry: 'sear-assembly-setup',
    matches: (id) => id.startsWith('sear-assembly-') || id === 'sear-sheet-editor-contract',
  },
  {
    label: 'Domain',
    summary: 'Documents, state, transactions, and the data model.',
    chapter: 'state',
    entry: 'sear-domain-workbook',
    matches: (id) => id.startsWith('sear-domain-'),
  },
  {
    label: 'Plugins',
    summary: 'Add editing behavior and optional sheet features.',
    chapter: 'plugins',
    entry: 'sear-plugin-selection',
    matches: (id) => id.startsWith('sear-plugin-'),
  },
  {
    label: 'Render',
    summary: 'Paint the scene, handle input, and coordinate viewport updates.',
    chapter: 'rendering',
    entry: 'sear-render-engine',
    matches: (id) => id === 'sear-render' || id.startsWith('sear-render-'),
  },
  {
    label: 'Host adapters',
    summary: 'Concrete browser and Node implementations of the core contracts.',
    chapter: 'platform-adapters',
    entry: 'sear-browser-adapters',
    matches: (id) => id === 'sear-browser-adapters' || id === 'sear-node-adapters',
  },
  {
    label: 'Foundation',
    summary: 'Shared platform, geometry, storage, and dependency contracts.',
    chapter: 'foundation',
    entry: 'sear-foundation-platform',
    matches: (id) => id.startsWith('sear-foundation-'),
  },
];

const entryPoints = {
  'sear-assembly-setup': ['createSheetEditor', 'SheetEditorConfiguration', 'createDocEditor', 'DocEditor'],
  'sear-assembly-core': ['SearCoreSheet', 'SearCoreDoc', 'Pipeline'],
  'sear-assembly-doc': ['ParagraphPlugin', 'TablePlugin', 'BoldTextStylePlugin'],
  'sear-assembly-workbook': ['createWorkbookEditor', 'WorkbookEditorConfiguration'],
  'sear-domain-doc': ['RichDocNode', 'DocNodeRegistry', 'DocSelection', 'DocCursorPos'],
  'sear-domain-formula-engine': ['IFormulaParser', 'IFormulaEvaluator', 'IFunctionRegistry', 'FormulaFunction'],
  'sear-domain-formula-engine-ts': ['FormulaParser', 'FormulaEvaluator', 'DependencyGraph', 'FunctionRegistry'],
  'sear-domain-workbook': ['createWorkbookDocumentState'],
  'sear-plugin-formula': ['SheetFormulaPlugin', 'RecalcScheduler', 'FormulaResultStore'],
  'sear-plugin-selection': ['SheetSelectionPlugin'],
  'sear-render-node': ['SceneGraph', 'Node', 'RenderNode'],
  'sear-render-engine': ['RenderEngine'],
  'sear-foundation-platform': ['Platform'],
};

const referenceExamples = {
  'sear-assembly-setup:createSheetEditor': `import {
  createSheetEditor,
  type SheetEditorAdapters,
} from '@searsuite/sear-assembly-setup';
import { createEmptySheetDocumentState } from '@searsuite/sear-assembly-sheet-state';
import { SelectRangeCommand } from '@searsuite/sear-plugin-selection';

async function openSheet(adapters: SheetEditorAdapters) {
  const sheetState = createEmptySheetDocumentState(20, 10);
  const editor = createSheetEditor({ adapters, sheetState });
  await editor.commands.run(SelectRangeCommand, { anchor: [0, 0], focus: [0, 0] });
  return editor; // The host calls editor.destroy() when the view unmounts.
}`,
  'sear-assembly-setup:createDocEditor': `import {
  createDocEditor,
  type DocDocumentState,
  type DocEditorAdapters,
} from '@searsuite/sear-assembly-setup';

function openDocument(adapters: DocEditorAdapters, documentState: DocDocumentState) {
  const editor = createDocEditor({ adapters, documentState });
  editor.focus();
  return editor; // The host calls editor.destroy() when the view unmounts.
}`,
  'sear-assembly-workbook:createWorkbookEditor': `import { createWorkbookEditor, type WorkbookEditorConfiguration } from '@searsuite/sear-assembly-workbook';

function openWorkbook(configuration: WorkbookEditorConfiguration) {
  const workbook = createWorkbookEditor(configuration);
  const activeSheet = workbook.sheets.getActiveEditor();
  return { workbook, activeSheet }; // The host later calls workbook.destroy().
}`,
};

function referenceDocumentation(symbol, packageItem) {
  const example = referenceExamples[`${packageItem.id}:${symbol.name}`];
  return example ? { ...symbol.documentation, examples: [example] } : symbol.documentation;
}

const formulaFunctionSections = {
  addIn: 'Add-in functions',
  compatibility: 'Compatibility functions',
  conditional: 'Logical and conditional functions',
  cube: 'Cube functions',
  database: 'Database functions',
  dateTime: 'Date and time functions',
  engineering: 'Engineering functions',
  financial: 'Financial functions',
  google: 'Google service functions',
  information: 'Information functions',
  lookup: 'Lookup and reference functions',
  math: 'Math and statistics functions',
  statistical: 'Statistics functions',
  text: 'Text functions',
  web: 'Web service functions',
};
const mathFunctionSections = {
  aggregation: 'Aggregation functions',
  array: 'Array functions',
  basic: 'Basic math functions',
  combinatorics: 'Combinatorics functions',
  random: 'Random functions',
  rounding: 'Rounding functions',
  statistics: 'Statistics functions',
  trigonometry: 'Trigonometry functions',
};
const engineeringFunctionSections = {
  bessel: 'Bessel functions',
  bitwise: 'Bitwise functions',
  comparison: 'Comparison functions',
  complex: 'Complex number functions',
  conversion: 'Unit conversion functions',
  errorFunction: 'Error functions',
  radix: 'Number base functions',
};

function functionSection(symbol, packageItem) {
  if (packageItem.id === 'sear-domain-formula-engine-ts') {
    const mathCategory = symbol.sourcePath.match(/\/functions\/math\/([^/]+)\//)?.[1];
    if (mathCategory) return mathFunctionSections[mathCategory] ?? 'Other math functions';
    const category = symbol.sourcePath.match(/\/functions\/([^/]+)\//)?.[1];
    if (category === 'shared') return null;
    return category ? formulaFunctionSections[category] ?? 'Other formula functions' : null;
  }
  if (packageItem.id === 'sear-plugin-formula-engineering') {
    const category = symbol.sourcePath.match(/\/src\/([^/]+)\//)?.[1];
    return category ? engineeringFunctionSections[category] ?? 'Other engineering functions' : null;
  }
  return null;
}

const topicSections = {
  'sear-assembly-core': [
    ['Editor runtimes', /SearCore|SheetLifecycle|SheetEditSession|SearLifecycle/],
    [
      'Pipeline',
      /Pipeline|CommandExecution|CommandId|CommandObserver|CommandDefinition|CommittedSheetState|ContractViolation|Registry|AssemblyError/,
    ],
    ['Document input and layout', /Doc|Cursor|Composition/],
    ['Sheet interaction', /Sheet|Selection|CellMatrix/],
  ],
  'sear-assembly-commands': [
    ['Editor client', /^SheetEditor$/],
    ['Plugin contracts and capabilities', /Plugin|Runtime|Capability|FormulaProviderRegistry|SheetCellStyle/],
    ['Displayed value publication', /DisplayedValue/],
    ['Command dispatch', /^(?:Doc|Sheet)Command|^DocEditorCommand|^define(?:Doc|Sheet)Command|^CommandExecutionPhase/],
    ['Transactions', /Transaction|Pipeline|EffectCommand|LocalActionCommand|createSheetTransaction/],
    ['Selection', /Selection|SelectRange|selectRange|moveSelection|extendSelection/],
    ['Sheet structure', /Column|Row|Axis|Structure/],
    ['Cell ranges', /Range|CellPoint/],
    ['Queries', /Query/],
  ],
  'sear-assembly-doc': [
    ['Document state and editing model', /DocEdit|DocHistory|DocSelection|DocNavigation|HistoryPlugin|SelectionPlugin|TextInputPlugin|createDocDocumentFormatting/],
    ['Embedded editing policies', /^Sheet(?:Clipboard|Embedded|FormulaReference|Shortcut|Composition|Delete|InlineStyle|Input|Key|Text|Edit)/],
    [
      'Document plugin contracts',
      /^(?:DocPlugin|DocRuntime|DocCaretPluginKey|DocCompositionPluginKey|DocContentRenderPluginKey|DocSelectionPluginKey)/,
    ],
    ['Document input', /DocInteraction|DocInput|DocCaretState|DocKeyboard|DocPointer/],
    ['Document rendering', /DocContent|DocRender|DocVirtual/],
    ['Register document extensions', /^registerDocPlugin|^createDocCommand|^defineDocRuntimeCapability/],
    ['Blocks and tables', /Paragraph|Table|LineBox|LineSpacing|SplitDoc|RichText|InsertDocTable/],
    ['Text style definitions', /TextStyle|StyleKey|StylePlugin/],
    ['Style commands', /^(?:SetDoc|ToggleDoc)(?:Bold|Italic|Underline|Strikethrough|Font|TextColor)/],
    ['Style contributions', /^create(?:Bold|Italic|Underline|Strikethrough|Font|TextColor)/],
    [
      'Editing commands',
      /Command|^InsertDoc|^LoadDocument|^MoveDoc|^SetDoc|^ToggleDoc|^DeleteDoc|^ClearDoc|^FocusDoc|^RenderDoc|^SelectAllDoc/,
    ],
  ],
  'sear-assembly-plugin': [
    ['Transaction pipeline and command scope', /Pipeline|Command|Sear.*Error/],
    ['Interaction state', /SheetInteraction|SheetEditSession/],
    [
      'Plugin lifecycle',
      /^(?:Plugin|PluginKey|PluginManager|PluginSpec|PluginExtension|EditorLifecycleError|EditorLifecycleErrorCode|EditorLifecycleStack)$/,
    ],
    ['Host controls', /^(?:HeadlessToolbar|SearToolbar|SearFormulaBar)$/],
    [
      'Commands, queries, and observations',
      /PluginCommand|PluginQuery|PluginObservation|hasPlugin(?:Command|Query|Observation)/,
    ],
    [
      'Plugin state and transactions',
      /PluginConfig|PluginData|PluginDocument|PluginState|PluginTransaction|RegisteredPlugin|ContributionWrite|assertSheet|sealSheet|createPlugin/,
    ],
    ['Capabilities and session state', /RuntimeCapability|SessionState/],
    [
      'Move and reorder ranges',
      /SheetRange|SheetMoveRange|SheetStructureMove|^intersectSheet|^isPointInSheet|^subtractSheet|^translateSheet|^createSheetRangeRule/,
    ],
    ['Transfer formats', /SheetFormat|MatrixFormat|PortableFormat|^createMatrixFormat/],
    ['Transfer clipboard metadata', /^(?:SheetClipboard|SheetPortableClipboard)/],
  ],
  'sear-assembly-setup': [
    ['View extension composition', /DefaultDocViews|View/],
    [
      'Create an editor',
      /^(?:createDocEditor|createSheetEditor|DocEditor|SheetEditor|DocDocumentState|SheetDocumentState|DocEditorAdapters|SheetEditorAdapters|DocEditorConfiguration|SheetEditorConfiguration)$/,
    ],
    [
      'Document editing commands',
      /^(?:ClearDoc|DeleteDoc|FocusDoc|InsertDoc|LoadDocument|MoveDoc|SelectAllDoc|SetDoc|SplitDoc|ToggleDoc|UndoDoc|RedoDoc)/,
    ],
    ['Document lifecycle commands', /^(?:Doc|.*Doc).*Command(?:Result)?$|^.*Doc.*Input$|^DocInputBindingRegistry$/],
    [
      'Document plugins and styles',
      /^(?:Doc|RichText).*Plugin|^(?:Caret|History|Selection|TextInput|Paragraph|Table)Plugin$|TextStyle|StyleKey|^RichTextInlineStyle$|^DefaultDocFeaturePlugins$|^registerDocPlugin|^registerDocFeature|^registerDefaultDocFeatures/,
    ],
    [
      'Document rendering and viewport',
      /^(?:Doc|RichText).*?(?:Render|Viewport|Caret|VirtualLayout|ContentRect)|^RichText(?:BlockNode|RunNode)|^createRichTextRunRect$|^registerDocViewport/,
    ],
    [
      'Document state and observations',
      /^Doc|^RichText|^registerDoc|^createRichText|^Caret|^TextInput|^Selection|^History|^Paragraph|^Table|^Bold|^Italic|^Underline|^Strikethrough|^Font|^TextColor|^InsertDoc|^SetDoc|^ToggleDoc|^DeleteDoc|^SplitDoc|^ClearDoc|^FocusDoc|^LoadDocument|^MoveDoc|^SelectAllDoc|^RenderDoc|^UpdateDoc|^ApplyDoc|^ResizeDoc|^ScrollDoc|^ExportDoc|^CaptureDoc|^UndoDoc|^RedoDoc/,
    ],
    [
      'Sheet commands and snapshots',
      /Command(?:Result)?$|Input$|^cloneSheet|^createDefaultSheet|^createEmptySheet|^deserializeSheet|^serializeSheet|^registerSheetStateSnapshot/,
    ],
    [
      'Sheet plugins and capabilities',
      /^Sheet.*(?:Plugin|RuntimeCapability|RuntimeExtension)|^DefaultSheet|^defineSheetRuntimeCapability$|^registerSheetConfig|^registerSheetPlugin/,
    ],
    [
      'Sheet viewport and session',
      /^Sheet|^registerSheet|^ApplyViewport|^ScrollViewport|^ResizeSheet|^ExportSheet|^CaptureSheet|^UnregisterSheet|^createSheet/,
    ],
    [
      'Plugin and session setup',
      /Plugin|SessionState|RuntimeCapability|^registerDefaultDependencies|^defineSessionState|^readSessionState|^ViewportOverlay/,
    ],
  ],
  'sear-assembly-workbook': [['Create a visual workbook', /WorkbookEditor|WorkbookSheetEditorFactory|createWorkbookEditor/]],
  'sear-assembly-workbook-kernel': [
    ['Business runtime assembly', /createWorkbookRuntime|WorkbookRuntimeConfiguration|WorkbookSheetClientFactory/],
    [
      'Create a workbook editor',
      /WorkbookEditor|^createWorkbookEditor|WorkbookPlugin|WorkbookRuntimeCapability|^resolveWorkbookPlugins|^registerWorkbookPlugin|^defineWorkbookRuntimeCapability/,
    ],
    [
      'Add and switch sheets',
      /^(?:Activate|Add|Remove|Move|Rename|Hide|Unhide)WorkbookSheet|WorkbookSheetsApi|WorkbookSheetClientsApi|WorkbookSheetEditorFactory|firstVisibleSheetId/,
    ],
    ['Workbook document state', /WorkbookDocument|WorkbookSheetStateCapture|^serializeWorkbook|^deserializeWorkbook/],
    [
      'Capture sessions',
      /WorkbookSession|WorkbookActiveSheet|WorkbookCompanionSheet|WorkbookSheetSession|^CaptureWorkbookSession|^ExportWorkbookState/,
    ],
    ['Formula objects and names', /FormulaObjects|FormulaTable|DefinedName|^SetWorkbookFormula|^RemoveWorkbookFormula/],
    [
      'Formula references',
      /FormulaReference|FormulaBrokenReference|FormulaGraphReference|FormulaDraft|FormulaCompiledReferenceShift|^PickWorkbookFormula|^CancelWorkbookFormula|^RestoreWorkbookFormula|^CaptureWorkbookFormula/,
    ],
    ['Recalculate formulas', /Formula|^RecalculateWorkbook|readWorkbookUpdatedCells/],
    [
      'History and collaboration',
      /History|Collaboration|^UndoWorkbook|^RedoWorkbook|^ConnectWorkbook|^DisconnectWorkbook/,
    ],
    [
      'Commands and transactions',
      /Command|Transaction|CommandExecutionPhase|WorkbookRuntimeExtensionRegistry|WorkbookRangeMoveError|WorkbookStructureMoveError/,
    ],
  ],
  'sear-domain-doc': [
    [
      'Document nodes',
      /Node|Schema|RichTextChar|^stringToRichDoc|^cloneRichDocument|^isDocSemanticallyEmpty|^createEmptyParagraph|^normalizeDocForEdit|^paraText/,
    ],
    [
      'Selection and positions',
      /Selection|Cursor|^compareCursor|^getDocumentOffset|^resolveTextContent|^getTextNodeLength|^isCollapsed/,
    ],
    ['Text formatting', /Style|Format|Attribute|Grapheme|InlineText|TextRange/],
    ['Text layout', /Layout|Line|Spacing|Baseline|BlockFlow/],
  ],
  'sear-domain-cell-types': [
    ['Semantic cell styles and display values', /Style|RulePriority|IconShape|extractRichText|formatFormulaValue/],
    ['Cell values', /CellType|CellMatrixElement/],
    [
      'Formatting and displayed values',
      /Format|Alignment|DisplayedValue|NumberDisplay|formatCell|interpretNumber|parseFormattedNumber|GeneralNumber/,
    ],
    ['Input and commit', /Commit|InputValidat|ExtensionWrite/],
    ['Clipboard transfer', /Clipboard/],
  ],
  'sear-domain-editor': [
    [
      'Editor and layout',
      /SearEditor|DocLayout|DocPage|DocViewport|BlockLayout|LayoutLine|DocVerticalAlign|computeViewportRange/,
    ],
    ['Snapshots and rendering', /Snapshot|Render|Raster|lockLayoutSnapshot/],
  ],
  'sear-domain-formula-engine': [
    ['Parse expressions', /IFormulaParser|FormulaAST|FormulaNodeKind|^FormulaReferenceNode$|BinaryOp|UnaryOp/],
    [
      'Resolve references',
      /^(?!moveFormulaReferences|reorderFormulaReferences).*Reference|CellKey|FormulaCellPosition|ResolvedFormulaRange|FormulaRangeSource|FormulaRangeCell|FormulaSheetMetadata|FormulaWorkbookMetadata/,
    ],
    [
      'Track structural changes',
      /Structure|RangeMove|matrixOperation|moveFormulaReferences|reorderFormulaReferences|shiftStructureCoordinate|^Dependency$|DependencyGraph|FormulaDynamicDependencyRegistrar/,
    ],
    [
      'Evaluate formulas',
      /IFormulaEvaluator|IFunctionRegistry|FormulaFunction|EvalContext|EvalResult|FormulaEvaluation|FormulaIteration|FormulaCalculationTrace|IAggregationCache/,
    ],
    [
      'Formula values and errors',
      /FormulaValue|FormulaArg|FormulaArray|FormulaTuple|FormulaRichResult$|FormulaText$|^FormulaError(?:$|Code$)|^ErrorCode$|^createFormulaError|^isFormula|^CellChange$/,
    ],
    [
      'Results and status',
      /FormulaBatch|FormulaCell|FormulaDependenciesChanged|FormulaFlushed|FormulaRecalculation|FormulaErrorChanged|IFormulaResultProvider|IFormulaSourceProvider|IFormulaStatusProvider|IFormulaRichResultProvider|FormulaMetadataReader/,
    ],
    ['Dates and locales', /Date|Locale|Language|Phonetic|IFormulaTextServiceProvider/],
    ['Add-ins and external services', /AddIn|ExternalService|EnvironmentMetadata|ServiceCache/],
    ['Cube and pivot services', /Cube|Pivot/],
    ['Web and data services', /Google|Hyperlink|Image|Rtd|Stock|Web/],
  ],
  'sear-domain-formula-engine-ts': [
    [
      'Parse and evaluate formulas',
      /FormulaParser|FormulaEvaluator|FormulaFormatter|FormulaLexicalScope|FormulaExecutionBudget|DependencyGraph|ParsedCellRef|CellRef|cellKey|CellKey|WorkbookFormulaFormatOptions/,
    ],
    ['Register functions', /FunctionRegistry|FormulaExternalServiceRegistry|UnavailableFormulaAddInService/],
    ['Service caches', /Cache|ServiceRegistry/],
    ['Date and financial helpers', /Date|Financial|Bond|Coupon|Depreciation|DayCount|numericDateText/],
  ],
  'sear-domain-workbook': [
    [
      'Workbook state',
      /Workbook(?:DocumentState|Sheet|Error|Id)|SheetState|^createWorkbookDocumentState|^validateWorkbookDocumentState|^addWorkbookSheet|^removeWorkbookSheet|^moveWorkbookSheet|^renameWorkbookSheet|^setWorkbookSheetHidden|^updateWorkbookSheetState|^getWorkbookSheet/,
    ],
    ['References', /Reference|Coordinate|CellKey|^quoteWorkbookSheetName|^isValidWorkbookReference/],
  ],
  'sear-domain-ot': [
    [
      'Operations and transforms',
      /^BaseOT$|^Operation$|^OT|TransactionOT|Transform|Clone|EncodedValue|^getAllActionNames|^transactionOTTypeKey/,
    ],
    ['Row and column operations', /Col|Row|Structure|^isResize/],
    ['Cell and rectangle operations', /Matrix|Cell|Rect|^isMatrix|^isUpdateCell|^createUpdateRect/],
    ['Document operations', /RichDoc|Node|String|Attrs|Schema|TextSchema/],
  ],
  'sear-foundation-platform': [
    ['Host platforms', /Platform|FrameRequest|EventListener|ViewOffset/],
    ['Network services', /WebService|WebFetch|Http/],
    ['XML evaluation', /XmlXPath|XmlDocumentParser/],
    ['File downloads', /FileDownload/],
  ],
  'sear-plugin-selection': [
    ['Selection', /Selection|SelectRange|ActiveCell|^GetSelections|^GetSelection|^registerSelection/],
    ['Dragging and moving', /Drag|Move|Fill|ClearSelected|RangeMove/],
    ['Highlights', /Highlight/],
  ],
  'sear-plugin-alignment': [
    ['Horizontal alignment', /^(?!.*Vertical).*Alignment|SheetHorizontal/],
    ['Vertical alignment', /VerticalAlignment|SheetVertical/],
  ],
  'sear-plugin-cell-highlight': [
    ['Highlight rules', /Rule|Condition|Operator|Style|Kind|RangeReader|ValueReader/],
    ['Apply and read highlights', /Highlight|^AddCell|^ClearCell|^RemoveCell|^ReadCell|^readSheetCell/],
  ],
  'sear-plugin-cell-merge': [
    [
      'Merge and unmerge',
      /MergeCells|UnmergeCells|CellMerge|SheetCellMerge|SheetMergeInput|^readSheetCellMerges|^registerSheetCellMerge/,
    ],
    [
      'Analysis and conflicts',
      /Analysis|Analyze|ConfirmationError|MoveError|ContentSource|ActionDataSource|CommandDataSource/,
    ],
  ],
  'sear-plugin-checkbox': [
    [
      'Checkbox values',
      /CheckboxCell|checkboxText|parseCheckboxText|isCheckboxCell|CheckboxError|CheckboxRemovalMode|CheckboxMutationLimit/,
    ],
    ['Edit checkboxes', /Checkbox|^normalizeCheckboxRange/],
  ],
  'sear-plugin-formula': [
    ['Value publication and links', /FormulaValuePublisher|FormulaHyperlink/],
    [
      'Run evaluation',
      /SheetFormulaPlugin|sheetFormulaPluginKey|RecalcScheduler|FormulaPluginState|FormulaRegistryOwnership|FormulaSchedulerDataSource|FormulaResultStore/,
    ],
    [
      'Results and status',
      /FormulaCellStatus|FormulaDependencyStatus|FormulaDependencyCellRef|FormulaIdle|^GetFormula|^WaitForFormula|^waitForFormulaIdle|^lockFormulaResultValue|^registerFormulaStatus|FormulaResult(?!Provider)|FormulaCalculationTraceObservation/,
    ],
    [
      'Providers and registries',
      /Provider|Registry|ExternalService|FormulaFunction|FormulaTextService|CellFormulaValue|^UnregisterFormula/,
    ],
    [
      'Schedule and invalidate',
      /FormulaWork|FormulaBatch|FormulaDirty|FormulaRenderInvalidat|FormulaViewport|FormulaCalculationTrace|^MarkFormula|^DiscardFormula|^ResumeFormula|^RunFormula/,
    ],
    ['Formula references', /Reference|FormulaRef|CrossSheet|Highlight|ColorPalette|^getFormulaReferenceColor/],
  ],
  'sear-plugin-cell-editor': [
    ['Editing state and options', /CellDocumentFormatting|SheetCellEditorOptions|EditorState|PickedReferenceKind|CellEditDraft|CellEditModel/],
    [
      'Open and commit an edit',
      /^(?:SheetCellEditor(?:ExitReason|Kind|Plugin)|SheetBeginCellEditInput|SheetCancelCellEditInput|SheetCommitCellEditInput|SheetOpenCellEditorInput|BeginCellEditCommand|CancelCellEditCommand|CommitCellEditCommand|InsertCurrentDateTimeCommand|OpenCellEditorCommand|IsCellEditingQuery|getCellEditableValue)$/,
    ],
    [
      'Embedded document input',
      /SheetDocument|SheetInline|SheetRangeText|SheetCellEditSelection|^HandleDocument|^ReadSelectedCellEditTextQuery|^SetCellInline|^SetRangeCell|^UpdateCellEditorDocumentSelection|^RequestCellEditorRender/,
    ],
    [
      'Formula input and references',
      /Formula|Suggestion|Highlighter|Highlight|^formatPickedReference|^findTrailingSheetQualifierStart/,
    ],
    ['Editor interaction', /Interaction|Pointer|Drag|Pipeline|^registerSheetCellEditor/],
  ],
  'sear-plugin-clipboard': [
    ['Copy, cut, and paste', /Copy|Cut|Paste|SheetClipboardPlugin|SheetClipboard$|SheetClipboardPort/],
    [
      'Clipboard data and codecs',
      /Codec|Payload|Decode|DataSource|Merged|MergePlan|MIME|VERSION|ClipboardError|ClipboardRow|ClipboardCellPoint|ClipboardRangeInput|SheetClipboardSheetIdentity|SheetClipboardCommandResult|AbstractSheetClipboard|InMemorySheetClipboard/,
    ],
  ],
  'sear-plugin-collab': [
    [
      'Connect and observe a session',
      /Transport|Channel|Session|Connect|Disconnect|Status|ConnectionState|SheetCollaborationPlugin/,
    ],
    [
      'Apply and exchange operations',
      /Operation|Submission|Batch|Message|Protocol|Sync|ExternalEvent|ApplySheetCollaborationEvent/,
    ],
  ],
  'sear-plugin-data-validation': [
    [
      'Set and read rules',
      /Command|Query|Observation|FieldKey|^readSheetDataValidations|^formatDropdown|^parseDropdown|^resolveDropdown/,
    ],
    ['Evaluate input', /Validation|Evaluator|DropdownMode|InputPolicy|^hasIntegerSolution$/],
  ],
  'sear-plugin-dropdown': [
    ['Dropdown indicators', /DropdownIndicator/],
    [
      'Read and change a cell',
      /DropdownCell|DropdownValue|^ClearDropdown|^ReadDropdown|^assertDropdown|^readDropdownCell|^formatDropdown|^parseDropdown/,
    ],
    [
      'Open the picker',
      /Picker|Option|SheetDropdownPlugin|SheetDropdownOptions|DropdownMode|DropdownLimits|DropdownError/,
    ],
  ],
  'sear-plugin-duplicate': [
    [
      'Find and highlight duplicates',
      /DuplicateMatrix|DuplicatePlugin|DuplicateHighlight|DuplicateKeep|DuplicateCommandDataSource|DuplicateFieldKey|HighlightDuplicate|^createHighlight|^readSheetDuplicate|^assertSheetDuplicate|^isSheetDuplicate/,
    ],
    [
      'Clear or delete duplicates',
      /ClearDuplicate|DeleteDuplicate|DuplicateClear|DuplicateDelete|^createClear|^createDelete|^registerSheetDuplicate/,
    ],
  ],
  'sear-plugin-filter': [
    [
      'Filter rules and values',
      /FilterColumnRule|FilterDefinition|FilterPredicate|FilterCategory|FilterColor|FilterKind|FilterOperator|FilterValue|^sheetFilterValueKey|ReadSheetFilter/,
    ],
    ['Apply and update filters', /Filter|RowVisibility/],
  ],
  'sear-plugin-find-replace': [
    [
      'Find matches',
      /FindMatch|FindPage|FindRange|FindSource|FindInput|FindContent|FindOrder|^findSheet|^FindSheet|^ReadSheetFind|MAX_SHEET_FIND/,
    ],
    ['Replace matches', /Replace|^replaceSheet/],
    ['Plugin and errors', /FindReplace/],
  ],
  'sear-plugin-resize': [
    ['Drag to resize', /ResizeDrag|^BeginSheetResizeDrag|^EndSheetResizeDrag|^UpdateSheetResizeDrag/],
    ['Hide and unhide rows or columns', /Hide|Unhide|HiddenOriginal/],
    ['Set row and column sizes', /Resize|Sizes|Dimension/],
  ],
  'sear-plugin-formula-engineering': [
    [
      'Register engineering functions',
      /EngineeringFunctionRegistrationOptions|engineeringFunctions|registerEngineeringFunctions/,
    ],
  ],
  'sear-render-context': [
    [
      'Drawing API',
      /^(?:RenderContext|RenderImageData|RenderNodeSemantics|RenderPointerEvent|RenderGradient|RenderImageSource|RenderPaint|RenderPattern|EventWithOffset)$/,
    ],
    ['Coordinates', /Coordinate/],
    ['Canvas and SVG', /Canvas|Svg|^WebRenderContext/],
    ['WebGL', /WebGL/],
    ['Headless rendering', /Headless/],
  ],
  'sear-render-engine': [
    ['Render engines', /RenderEngine|RenderContextFactory|RenderViewport/],
    [
      'Sheet data',
      /DataEngine|DataView|SheetData|CellData|CellMatrix|SheetMatrix|ProjectedOperations|^readDense|^readSheetData|^registerReadSheet/,
    ],
    ['Row and column sizes', /Row|Column|Visibility|Size|Dimension/],
  ],
  'sear-render-node': [
    ['Text style paint contributions', /RenderContribution/],
    [
      'Scene graph',
      /^(?:SceneGraph|Node|RenderNode|Container|Tree|NodeProperties|RenderNodeKey|LayoutNode|BlockManager|DirtyTree|FrameDirtyTracker)$/,
    ],
    ['Shape nodes', /BoxNode|TextNode|DashedLine|Affix|ViewportOverlay|ClipRegion|StickyNode|SheetCorner|createDragGuideNode/],
    ['Cell visuals', /CellVisual/],
    ['Rich text rendering', /RichText/],
    ['Hit testing and spatial indexes', /HitColor|BVH|RTree|KDTree|Octree|QuadTree|SpatialHash|EventListener/],
  ],
  'sear-render-registry': [
    ['Renderer definitions', /RendererDefinition|defineCellRenderer/],
    [
      'Cell renderers',
      /Cell$|CellContext|CellProperties|CellRegion|CellRenderType|^extractRichText|^formatFormulaValue|FormulaResultProvider/,
    ],
    ['Renderer registration', /Registry|Factory|Coordinator/],
    ['Cell visuals', /Visual|EmbeddedEditor/],
  ],
  'sear-render-strategy': [
    ['Drawing strategies', /RenderStrategy|ScreenRender|EventRender|HitRender|OverlayRender|StickyRender/],
    [
      'Incremental redraw',
      /Dirty|Incremental|INCREMENTAL|ViewportFrameCache|FrameMode|clearViewport|ViewportClear|ViewportFrameRebuild|ViewportDirty|ViewportExplicitNodeClear|RenderContextCapabilities/,
    ],
    ['Raster copying', /RasterCopy|BlockRaster/],
  ],
  'sear-sheet-editor-contract': [
    ['Document and positions', /Document|Geometry|Point|Rect|TextPosition/],
    ['Input and selection', /Input|Cursor|Selection|Composition|InlineStyle|EditHistory/],
    ['Render and editor session', /Render|Editor|EditSession|Invalidation/],
  ],
  'sear-assembly-config': [
    [
      'Configuration defaults',
      /Config$|default.*Config|EditorDefaultConfigOverrides|IncrementalRenderPolicyLimitsConfig/,
    ],
    ['Editor configuration storage', /ConfigEngine|ConfigUnit/],
  ],
  'sear-domain-cell': [
    [
      'Cell definitions',
      /CellType|CellRenderDefinition|CellRendererDefinition|defineCellRenderer|registerBuiltinCellDefinitions/,
    ],
    ['Display and transfer', /Display|Formatting|Clipboard|FormatTransfer|FormulaResultReader/],
  ],
  'sear-domain-collaboration': [
    ['Authority and contributions', /Authority|Contributor|Engine|Contribution|OperationType|Effect|Error/],
    ['Protocol messages', /Message|Submission|Batch|ProtocolVersion/],
  ],
  'sear-domain-commands': [
    ['Normalized text input', /TextInput/],
    ['Document transactions', /Transaction|DocStep|DocCommandContext|DocCommand$|DocCursorDirection/],
    ['Editing commands', /Command$/],
  ],
  'sear-domain-format': [
    ['Format a value', /format|Format|Spreadsheet|DefaultSpreadsheetFormatLocale/],
    ['Parse dates and numbers', /parse|ExcelDate|excelDate/],
  ],
  'sear-domain-matrix': [
    [
      'Sparse matrix storage',
      /CSRMatrix|ISheetState|SerializedSparseMatrix|SerializationError|serializeSparseMatrix|deserializeSparseMatrix/,
    ],
    ['Move and reorder ranges', /RangeMove|MoveRange|RangeReorder|MoveConflict/],
  ],
  'sear-foundation-rect': [
    ['Rectangle values', /^(?!.*Manager).*Rect|Point|emptyPositionRect|createEmptyRect/],
    ['Rectangle managers', /Manager/],
  ],
  'sear-foundation-subscription': [
    ['Define observations', /Definition|ObservationKind|defineEvent|defineState/],
    ['Register and subscribe', /Observation|SubscriptionManager/],
  ],
  'sear-foundation-utils': [
    ['Column labels', /columnIndexToLabel|columnLabelToIndex/],
    ['Colors', /Color/],
    ['Value comparison', /deepEqual/],
    ['Numeric helpers', /erf|erfc|isFormula|isNumber|toNumber/],
  ],
  'sear-plugin-cell-border': [
    ['Border values', /BorderLine|BorderPreset|BorderSide|BorderStroke|SheetCellBorder$|BorderMatrix|BorderError/],
    ['Set and read borders', /Plugin|Command|Query|Input|FieldKey|^readSheetCellBorders/],
  ],
  'sear-plugin-cell-fill': [
    ['Fill values', /CellFill$|FillMatrix|assertSheetCellFill|isSheetCellFill/],
    ['Set and read fills', /Plugin|Command|Input|FieldKey|Operations|^readSheetCellFills/],
  ],
  'sear-plugin-cell-format': [
    ['Format state', /FormatMatrix|FormatReader|FormatPlugin|FormatFieldKey/],
    ['Change and read formats', /Command|Query|Input|Operations|^readSheetCellFormats|^registerSheetCellFormat/],
  ],
  'sear-plugin-export': [
    ['Document codecs', /Codec|ModuleContribution/],
    ['Export files', /Sear|ExportError|FileFormat/],
    ['JSON values', /Json|readRecord/],
  ],
  'sear-plugin-fixed-row': [
    ['Fixed row state', /FixedRowMatrix|FixedRowPlugin|FixedRowsFieldKey/],
    ['Set and read fixed rows', /Command|Input|Operations|^readSheetFixedRows|^registerSheetFixedRow/],
  ],
  'sear-plugin-format-painter': [
    ['Paint a range', /Painter|^StartFormatPainter|^ApplyFormatPainter|^CancelFormatPainter/],
    ['Transfer formats', /Transfer|SheetFormatRange|MatrixFormat/],
  ],
  'sear-plugin-freeze': [
    ['Freeze state', /FreezeBoundary|FreezeMatrix|FreezePlugin|FreezeState|FreezeFieldKey/],
    ['Set and read freeze boundaries', /Command|Operations|^readSheetFreeze/],
  ],
  'sear-plugin-history': [
    [
      'History state',
      /History$|HistoryPlugin|HistoryEntry|HistorySession|HistoryStatus|StatusProvider|StatusObservation/,
    ],
    ['Undo and redo', /Undo|Redo/],
  ],
  'sear-plugin-i18n': [
    [
      'Register locales',
      /LocaleRegistry|LocaleEntry|LocaleRegistration|BuiltInLocale|^registerBuiltIn|^isSheetI18nLocale/,
    ],
    ['Change the editor locale', /Locale|I18n|SetSheet|ToggleSheet|UnregisterSheet/],
  ],
  'sear-plugin-sheet-demo': [
    ['Marker state', /DemoMatrix|DemoPlugin|DemoMarker$|DemoFieldKey|DemoStateToken|^assertSheetDemoMarker/],
    ['Set and read markers', /Command|Quer|Input|^readSheetDemoMarkers/],
  ],
  'sear-assembly-sheet-doc': [
    ['Embedded editor views', /View/],
    ['Embedded document editor', /EditorAdapter|EmbeddedDoc|EmbeddedEditor|InlineStyle|^createSheetEmbedded/],
    ['Sheet integration plugins', /Plugin|SheetOverflow|SheetShortcut|SheetClipboard|SheetFormula/],
  ],
  'sear-plugin-sort': [
    [
      'Sort a range',
      /SortSheetRangeCommand|SheetSortPlugin|SheetSortRangeInput|SheetSortDependencies|SheetSortError|^inferSheetSortHeader/,
    ],
    ['Keys and row order', /SortKey|SortValue|SortDirection|SortPermutation|^createSheetSortPermutation/],
  ],
  'sear-plugin-web-sheet-tabbar': [
    ['Tab and status models', /Adapter|Model|TabBarItem|WorkbookBinding|CreateSheetStateInput/],
    ['Web controls', /Web|CSS|MountOptions/],
  ],
  'sear-plugin-web-toolbar': [
    ['Toolbar commands', /Command|AdapterDefaults/],
    ['Web controls', /Toolbar|FormulaBar|Clipboard|ConditionalRule|ICONS|CSS/],
  ],
  'sear-render': [
    ['View extensions and options', /View|ViewKey/],
    ['Selection and range interaction', /Selection|RangeDrag|RangeMovePreview|AxisDragHighlight|AxisInsertionBoundary/],
    ['Cell editor presentation', /CellEditor|CellEdit/],
    ['Resize interaction', /Resize|Border/],
    ['Highlights and formula references', /Highlight|Reference|Highlighter/],
    ['Checkbox glyphs', /Checkbox/],
    ['Cursor and zoom presentation', /Cursor|Zoom|zoom/],
    ['Semantic style and validation projection', /StyleView|FilterVisual|numericValidation/],
    [
      'Grid and labels',
      /SheetCellMergeRender|SheetColumnLabelPlugin|SheetCornerPlugin|SheetGridPlugin|SheetGridRender|SheetRowNumberPlugin/,
    ],
    [
      'Viewport geometry',
      /SheetRangePositionContext|ViewportRange|activeFixedRowOffsets|computeViewportRange|getSheetRangePositionRect/,
    ],
  ],
  'sear-render-cursor': [
    ['Cursor engines', /CursorEngine|CursorRegistry|SheetCursorPlugin/],
    [
      'Cursor rules',
      /CursorPosition|CursorRule|CursorToken|PositionCursorRule|PredicateCursorRule|RegionCursorRule|TypeCursorRule/,
    ],
  ],
  'sear-render-event-engine': [
    ['View extensions', /ViewExtension/],
    ['Event registration', /EventEngine|EventRegistrar/],
    ['Event values', /EventWithOffset|normalizeEventKey|getViewHandlerName/],
  ],
  'sear-render-input': [
    ['Keyboard input', /KeyboardRouter|^Input$|^InputManager$/],
    ['Pointer capture', /PointerCapture/],
    ['Text input', /TextInput/],
  ],
  'sear-render-metrics': [
    ['Text shaping engines', /TextShaper|TextMeasurementManager|WebTextShaperContext/],
    ['Shape and font values', /Shaped|TextShape|FontDescriptor/],
  ],
  'sear-render-scroll': [
    ['Scroll state and control', /Scroller|ScrollManager|ScrollAxis|ScrollPublisher|createDefaultScrollManagerState/],
    ['Rubber band', /RubberBand|rubberBandDistance/],
  ],
};

const chapterTopics = {
  'sear-assembly-commands': { 'mutation-path': 'Command dispatch', 'transaction-flow': 'Transactions' },
  'sear-assembly-core': { 'core-runtime': 'Editor runtimes', 'pipeline-steps': 'Pipeline' },
  'sear-assembly-doc': {
    'doc-features': 'Document plugin contracts',
    'extension-points': 'Register document extensions',
  },
  'sear-assembly-plugin': { registration: 'Plugin lifecycle', lifecycle: 'Plugin lifecycle' },
  'sear-assembly-setup': { 'entry-points': 'Create an editor', 'editor-lifecycle': 'Create an editor' },
  'sear-assembly-workbook': {
    'create-workbook': 'Create a visual workbook',
    'switch-and-change': 'Create a visual workbook',
  },
  'sear-domain-doc': { 'document-tree': 'Document nodes', selections: 'Selection and positions' },
  'sear-domain-formula-engine': {
    'contract-and-runtime': 'Parse expressions',
    'formula-values': 'Formula values and errors',
  },
  'sear-domain-formula-engine-ts': {
    implementation: 'Parse and evaluate formulas',
    'built-in-functions': 'Register functions',
  },
  'sear-domain-workbook': { 'structure-and-session': 'Workbook state', 'structural-changes': 'Workbook state' },
  'sear-foundation-platform': { 'platform-contract': 'Host platforms', 'optional-services': 'Host platforms' },
  'sear-plugin-formula': { 'source-to-result': 'Run evaluation', recalculation: 'Schedule and invalidate' },
  'sear-plugin-selection': { 'select-and-read': 'Selection', 'selection-session': 'Selection' },
  'sear-render-context': { 'drawing-contract': 'Drawing API', coordinates: 'Coordinates' },
  'sear-render-engine': { 'data-to-frame': 'Render engines', 'host-boundary': 'Render engines' },
  'sear-render-node': { 'scene-tree': 'Scene graph', 'rich-text-and-hit-testing': 'Rich text rendering' },
};

const topicIntroductions = {
  'sear-assembly-commands': {
    'Sheet structure':
      'Insert, delete, and move commands create row or column operations that the editor can commit together.',
    Queries: 'Queries read the current editor state through the command surface without committing a change.',
  },
  'sear-assembly-doc': {
    'Text style definitions': 'Style keys identify the attributes stored on inline text runs.',
  },
  'sear-assembly-plugin': {
    'Capabilities and session state':
      'Capabilities expose editor-local services to plugins. Session state captures local UI state for restore without making it document content.',
    'Move and reorder ranges':
      'Feature contributions supply the analysis and operation needed to move state with a Sheet range.',
    'Transfer formats': 'Format transfer contributions copy feature-owned formatting alongside cell values.',
  },
  'sear-assembly-setup': {
    'Plugin and session setup':
      'A session snapshot holds local editor state for remounting. Durable Sheet and Doc content stays in the document state.',
  },
  'sear-assembly-workbook': {
    'Formula objects and names':
      'Defined names and formula tables belong to the Workbook, so expressions can refer to them across Sheets.',
    'Commands and transactions':
      'Workbook commands stage structural changes, and `WorkbookTransaction` commits them as one state transition.',
  },
  'sear-domain-cell-types': {
    'Cell values':
      '`CellType` identifies the kind of stored value. The built-in commit strategies handle text, numbers, booleans, formulas, and rich text.',
    'Formatting and displayed values':
      'Formatting turns a stored value into display text. `CellFormat` and the alignment values describe presentation without changing the underlying value.',
    'Input and commit':
      'A commit strategy interprets an edit before it enters Sheet state. Input validators can reject values that do not meet a feature’s rule.',
    'Clipboard transfer': 'Clipboard codecs preserve type-specific values when cells are copied and pasted.',
  },
  'sear-domain-editor': {
    'Editor and layout':
      '`DocLayoutEngine` computes document geometry for a viewport. The viewport and page contracts describe which part of that layout a host should paint.',
    'Snapshots and rendering':
      'Layout snapshots and block diffs identify the areas that changed so rendering can reuse unaffected work.',
  },
  'sear-domain-doc': {
    'Text formatting': 'Inline style functions patch a text range while preserving the surrounding document tree.',
  },
  'sear-domain-formula-engine-ts': {
    'Service caches':
      'Caches reuse external formula results while preserving the engine’s status and invalidation rules.',
  },
  'sear-domain-ot': {
    'Operations and transforms':
      '`TransactionOTRegistry` chooses the transform for concurrent operations. Use the built-in registry when a host must rebase local and remote changes.',
    'Sheet operations':
      'Matrix and rectangle operations describe cell edits and row or column changes. The creation helpers build operations with the expected shape.',
    'Document operations': 'Rich-document operations target nodes, text, and attributes in the document tree.',
  },
  'sear-foundation-platform': {
    'Host platforms':
      '`Platform` is the boundary for host timing and input. Choose `BrowserPlatform` for a web view or `HeadlessPlatform` when no visual host exists.',
    'File downloads': '`FileDownload` lets an export feature request a download without owning browser APIs.',
  },
  'sear-plugin-selection': {
    'Dragging and moving':
      'Drag and move commands update the selected range or fill it, while conflict queries check proposed moves.',
    Highlights: 'Highlight providers paint selection-related ranges without changing the committed selection.',
  },
  'sear-plugin-cell-highlight': {
    'Highlight rules':
      'A rule pairs a condition with a style. Range readers supply the cell values used to evaluate that condition.',
    'Apply and read highlights':
      'Add, remove, and clear commands change the stored rules; the read query returns the rules affecting a range.',
  },
  'sear-plugin-cell-merge': {
    'Merge and unmerge':
      'Merge commands change the range structure. The matrix and read helper expose merged ranges to other features.',
    'Analysis and conflicts':
      '`analyzeMergeCells` checks a proposed merge before it is committed. The error types describe conflicts with content or structural moves.',
  },
  'sear-plugin-checkbox': {
    'Checkbox values': '`CheckboxCell` stores a boolean cell value and its commit strategy interprets checkbox input.',
  },
  'sear-plugin-cell-editor': {
    'Open and commit an edit':
      '`BeginCellEditCommand` opens an edit session. `CommitCellEditCommand` applies the result; `CancelCellEditCommand` closes the session without committing.',
    'Formula input and references':
      'Formula drafts and reference-picking commands keep the formula being typed separate from the committed cell value.',
    'Editor interaction': 'Pointer and document-input commands route host events into the active embedded editor.',
  },
  'sear-plugin-clipboard': {
    'Copy, cut, and paste':
      'Range commands move Sheet content through the clipboard. A cut session tracks content until the paste commits.',
    'Clipboard data and codecs':
      'The codec represents cell values and merged ranges in a portable payload before a paste command reads them.',
  },
  'sear-plugin-collab': {
    'Connect and observe a session':
      '`ConnectSheetCollaborationCommand` starts a session over a host-provided transport. The status observation reports connection changes.',
    'Apply and exchange operations':
      'Committed local operations are submitted to the channel; remote operations return through the apply commands and are rebased against pending work.',
  },
  'sear-plugin-data-validation': {
    'Set and read rules':
      '`SetDataValidationRuleCommand` changes a range’s rule. Queries return the current rules and any issue for a cell.',
    'Evaluate input':
      '`evaluateDataValidation` checks a candidate value against a rule. Register an external evaluator for conditions the built-in evaluator cannot resolve.',
  },
  'sear-plugin-dropdown': {
    'Read and change a cell':
      'Cell readers obtain the value and available options from validation-owned rules; clear and pick commands write the chosen value.',
    'Open the picker':
      '`OpenDropdownPickerCommand` asks the host to show a picker. The picker request carries the cell and option data it needs.',
  },
  'sear-plugin-duplicate': {
    'Find and highlight duplicates':
      'Highlight commands mark duplicate rows without deleting them; the read helper exposes the marks for rendering.',
    'Clear or delete duplicates':
      'Clear removes only highlight state. Delete removes the selected duplicate rows through Sheet operations.',
  },
  'sear-plugin-filter': {
    'Filter rules and values':
      'A filter definition names the range and its column rules. Value queries provide the choices shown in a filter menu.',
    'Apply and update filters':
      '`CreateSheetFilterCommand` installs a filter, `SetSheetColumnFilterCommand` changes one column, and `ReapplySheetFilterCommand` refreshes row visibility.',
  },
  'sear-plugin-find-replace': {
    'Find matches':
      'Find queries return matching cells or a page of matches. Use the page query when the result set can be large.',
  },
  'sear-plugin-formula': {
    'Formula references':
      'Reference highlighting follows the draft formula and colors referenced ranges while the user edits it.',
  },
  'sear-plugin-resize': {
    'Drag to resize': 'Begin, update, and end commands keep a drag interaction separate from the final size change.',
    'Hide and unhide rows or columns':
      'Hide commands retain the original dimensions so an unhide operation can restore them.',
    'Set row and column sizes':
      'Resize commands write row or column dimensions; read helpers expose the values used by rendering.',
  },
  'sear-render-registry': {
    'Renderer registration':
      'Registries connect cell behavior and visual readers to a Sheet renderer. The coordinator manages those registrations for an editor.',
    'Cell visuals':
      'Visual readers supply feature-owned details such as labels or conditional appearance without changing stored cell data.',
  },
  'sear-render-context': {
    'Headless rendering':
      'Headless contexts preserve engine state and hit-test roles without producing a visible raster.',
  },
  'sear-render-engine': {
    'Row and column sizes': 'Size and visibility fields determine which Sheet cells occupy the visible viewport.',
  },
  'sear-render-node': {
    'Hit testing and spatial indexes':
      'Spatial indexes narrow the nodes considered for hit testing; hit colors connect painted regions back to nodes.',
  },
  'sear-render-strategy': {
    'Incremental redraw':
      'Dirty regions and the incremental policy decide whether a frame can reuse the previous one or needs a rebuild.',
    'Raster copying': 'Raster copy plans reuse already painted pixels when a viewport change makes that safe.',
  },
  'sear-sheet-editor-contract': {
    'Render and editor session':
      'The embedded editor reports render updates and session state to its Sheet host. `FakeSheetEmbeddedEditor` supports consumers that need a test implementation.',
  },
};

function renderChapter(chapter, packageItem, topic = false) {
  return `<section class="reference-concept${topic ? ' is-topic-intro' : ''}" id="${packageItem.id}-chapter-${
    chapter.slug
  }">
    ${topic ? '' : `<h4>${escapeHtml(chapter.title)}</h4>`}
    ${marked.parse(chapter.body)}
  </section>`;
}

function renderTopicIntroduction(packageItem, section) {
  if (packageItem.chapters.some((chapter) => chapterTopics[packageItem.id]?.[chapter.slug] === section)) return '';
  const text = topicIntroductions[packageItem.id]?.[section];
  return text ? `<div class="reference-concept is-topic-intro">${marked.parse(text)}</div>` : '';
}

function symbolSection(symbol, packageItem) {
  const formulaSection = functionSection(symbol, packageItem);
  if (formulaSection) return formulaSection;
  const topics = topicSections[packageItem.id];
  if (topics) {
    const topic = topics.find(([, match]) => match.test(symbol.name))?.[0];
    if (!topic) throw new Error(`${packageItem.name}:${symbol.name} needs a reference topic.`);
    return topic;
  }
  if (entryPoints[packageItem.id]?.includes(symbol.name)) return 'Core APIs';
  return 'API';
}

function sectionsFor(packageItem) {
  const sections = [...new Set(packageItem.symbols.map((symbol) => symbolSection(symbol, packageItem)))];
  const topicOrder = topicSections[packageItem.id]?.map(([title]) => title) ?? ['Core APIs'];
  return [
    ...topicOrder.filter((section) => sections.includes(section)),
    ...sections.filter((section) => !topicOrder.includes(section)).sort(),
  ];
}

function symbolsForSection(packageItem, section) {
  const leads = entryPoints[packageItem.id] ?? [];
  return packageItem.symbols
    .filter((symbol) => symbolSection(symbol, packageItem) === section)
    .sort((left, right) => {
      const leftPosition = leads.indexOf(left.name);
      const rightPosition = leads.indexOf(right.name);
      if (leftPosition < 0) return rightPosition < 0 ? 0 : 1;
      if (rightPosition < 0) return -1;
      return leftPosition - rightPosition;
    });
}

function navigationGroupFor(packageItem) {
  const group = navigationGroups.find((item) => item.matches(packageItem.id));
  if (!group) throw new Error(`No reference navigation group for ${packageItem.name}.`);
  return group;
}

const navigation = navigationGroups
  .map(
    (group) => `<details class="reference-nav-group" data-chapter="${group.chapter}" data-entry="${group.entry}">
  <summary>${group.label}</summary>
  ${visiblePackages
    .filter((packageItem) => navigationGroupFor(packageItem) === group)
    .map(
      (packageItem) =>
        `<a href="#${packageItem.id}">${escapeHtml(
          packageItem.name.replace('@searsuite/', ''),
        )}</a>`,
    )
    .join('\n')}
</details>`,
  )
  .join('\n');

const memberGroups = [
  ['constructor', 'Constructor'],
  ['properties', 'Properties'],
  ['methods', 'Methods'],
  ['static-properties', 'Static properties'],
  ['static-methods', 'Static methods'],
  ['values', 'Values'],
];

const symbolGroups = [
  ['classes', 'Classes'],
  ['interfaces', 'Interfaces'],
  ['enums', 'Enums'],
  ['types', 'Types'],
  ['functions', 'Functions'],
  ['variables', 'Variables'],
  ['namespaces', 'Namespaces'],
  ['other', 'Other APIs'],
];

function memberGroupFor(member, symbol) {
  if (symbol.kind === 'enum' || symbol.kind === 'enum-like' || member.kind === 'enum member') return 'values';
  if (member.kind === 'constructor') return 'constructor';
  if (member.flags.static) return member.kind === 'method' ? 'static-methods' : 'static-properties';
  return member.kind === 'method' ? 'methods' : 'properties';
}

function renderMember(member, packageItem) {
  const documentation = member.kind === 'constructor' &&
    /^Creates? (?:a|an) .+ instance\.$/i.test(member.documentation.summary)
      ? { ...member.documentation, summary: '' }
      : member.documentation;
  return `<section class="symbol-member" id="${member.id}" data-reference-member>
    <header><div class="member-signatures">${renderReferenceSignatures(renderReferenceMemberSignatures(member, packageItem), member.signatures)}</div></header>
    ${renderDocumentation(documentation, 'member-documentation')}
    ${renderParameterDocumentation(member.parameters)}
  </section>`;
}

function renderMemberGroups(symbol, packageItem) {
  return memberGroups.map(([key, label]) => {
    const members = symbol.members.filter((member) => memberGroupFor(member, symbol) === key);
    if (!members.length) return '';
    return `<details class="reference-member-group" data-member-group="${key}">
      <summary>${label} <span>(${members.length})</span></summary>
      <div class="symbol-members">${members.map((member) => renderMember(member, packageItem)).join('\n')}</div>
    </details>`;
  }).join('\n');
}

function renderEnumValues(symbol, packageItem) {
  if (!symbol.members.length) return '';
  const rows = symbol.members.map((member) => ({
    member,
    description: renderDocumentation(member.documentation, 'reference-enum-documentation'),
  }));
  const hasDescriptions = rows.some((row) => row.description);
  return `<section class="reference-enum-values" aria-label="Values">
    <table class="reference-enum-table">
      <caption>Values</caption>
      <thead><tr><th scope="col">Member</th><th scope="col">Value</th>${hasDescriptions ? '<th scope="col">Description</th>' : ''}</tr></thead>
      <tbody>${rows.map(({ member, description }) => `<tr id="${member.id}" data-enum-value>
        <th scope="row"><code>${escapeHtml(member.name)}</code></th>
        <td><code>${renderReferenceType(member.reflection.type, packageItem)}</code></td>
        ${hasDescriptions ? `<td>${description}</td>` : ''}
      </tr>`).join('\n')}</tbody>
    </table>
  </section>`;
}

function renderObjectMembers(symbol, packageItem) {
  return [['properties', 'Properties'], ['methods', 'Methods']].map(([key, label]) => {
    const members = symbol.members.filter((member) =>
      (member.kind === 'method' ? 'methods' : 'properties') === key);
    if (!members.length) return '';
    return `<section class="reference-object-members" aria-label="${label}">
      <h6>${label}</h6>
      ${members.map((member) => {
        const signatures = renderReferenceSignatures(renderReferenceMemberSignatures(member, packageItem), member.signatures);
        const content = `<div class="reference-object-member-signatures">${signatures}</div>`;
        return `<div class="reference-object-member" id="${member.id}" data-object-member>
          ${member.signatures.join('').length > 240
            ? `<details><summary>${escapeHtml(member.name)}</summary>${content}</details>`
            : content}
          ${renderDocumentation(member.documentation, 'reference-object-member-documentation')}
        </div>`;
      }).join('\n')}
    </section>`;
  }).join('\n');
}

function symbolGroupFor(symbol) {
  const groups = {
    class: 'classes', interface: 'interfaces', enum: 'enums', 'enum-like': 'enums', type: 'types',
    function: 'functions', variable: 'variables', namespace: 'namespaces',
  };
  return groups[symbol.kind] ?? 'other';
}

function renderSymbol(symbol, packageItem) {
  const isEnum = symbol.kind === 'enum' || symbol.kind === 'enum-like';
  const formulaFunction = functionSection(symbol, packageItem) &&
    symbol.signatures[0] === `${symbol.name}: FormulaFunction`;
  const simpleSignature = isEnum || symbol.objectMembers || symbol.signatures.length === 1 &&
    (symbol.signatures[0] === `${symbol.kind} ${symbol.name}` || formulaFunction);
  return `<div class="symbol${formulaFunction ? ' is-formula-function' : ''}" id="${symbol.id}" data-reference-symbol>
    <dt><span class="symbol-kind">${symbol.abstract ? 'abstract ' : ''}${escapeHtml(symbol.kind)}</span><a href="#${symbol.id}">${escapeHtml(symbol.name)}</a></dt>
    <dd>
      ${simpleSignature ? '' : `<div class="symbol-signatures">${renderReferenceSignatures(renderReferenceSymbolSignatures(symbol, packageItem), symbol.signatures)}</div>`}
      ${renderDocumentation(referenceDocumentation(symbol, packageItem))}
      ${renderParameterDocumentation(symbol.parameters)}
      ${isEnum ? renderEnumValues(symbol, packageItem) : symbol.objectMembers
        ? renderObjectMembers(symbol, packageItem) : renderMemberGroups(symbol, packageItem)}
      ${renderInheritedMembers(symbol, packageItem)}
    </dd>
  </div>`;
}

function renderSymbolGroups(symbols, packageItem) {
  return symbolGroups.map(([key, label]) => {
    const members = symbols.filter((symbol) => symbolGroupFor(symbol) === key);
    if (!members.length) return '';
    return `<div class="reference-symbol-kind-group" data-symbol-group="${key}">
      <h5>${label}</h5>
      <dl class="symbol-list">${members.map((symbol) => renderSymbol(symbol, packageItem)).join('\n')}</dl>
    </div>`;
  }).join('\n');
}

function renderPackage(packageItem) {
  const sections = sectionsFor(packageItem);
  for (const chapter of packageItem.chapters) {
    const topic = chapterTopics[packageItem.id]?.[chapter.slug];
    if (topic && !sections.includes(topic)) {
      throw new Error(`${packageItem.name} chapter ${chapter.slug} points to missing topic ${topic}.`);
    }
  }
  return `<section class="reference-package" id="${packageItem.id}" data-reference-package data-reference-group="${
    navigationGroupFor(packageItem).entry
  }">
  <header class="reference-package-header"><h3>${escapeHtml(packageItem.name.replace('@searsuite/', ''))}</h3><p>${escapeHtml(packageItem.description)}</p></header>
  ${packageItem.chapters
    .filter((chapter) => !chapterTopics[packageItem.id]?.[chapter.slug])
    .map((chapter) => renderChapter(chapter, packageItem))
    .join('\n')}
  ${sections
    .map((section) => {
      const sectionSymbols = symbolsForSection(packageItem, section);
      if (!sectionSymbols.length) return '';
      return `<section class="reference-symbol-section" id="${packageItem.id}-topic-${slug(section)}">
      ${section === 'API' ? '' : `<header><h4>${section}</h4></header>`}
      ${renderTopicIntroduction(packageItem, section)}
      ${packageItem.chapters
        .filter((chapter) => chapterTopics[packageItem.id]?.[chapter.slug] === section)
        .map((chapter) => renderChapter(chapter, packageItem, true))
        .join('\n')}
      ${renderSymbolGroups(sectionSymbols, packageItem)}</section>`;
    })
    .join('\n')}
</section>`;
}

function assertUniqueIds(html, page) {
  const ids = new Set();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    if (ids.has(match[1])) throw new Error(`${page} contains duplicate anchor ${match[1]}.`);
    ids.add(match[1]);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(match[1])) throw new Error(`${page} links to missing anchor ${match[1]}.`);
  }
}

const symbolCount = visiblePackages.reduce((total, item) => total + item.symbols.length, 0);
const template = readFileSync(resolve(sourceRoot, 'docs/ref/template.html'), 'utf8');
const detailChapters = navigationGroups
  .map((group) => {
    const members = visiblePackages.filter((item) => navigationGroupFor(item) === group);
    return `<section class="reference-detail-chapter" id="details-${group.chapter}" data-reference-detail-chapter>
    <header><h2>${group.label} APIs</h2></header>
    ${members.map(renderPackage).join('\n')}
  </section>`;
  })
  .join('\n');
const output = template
  .replace('<!-- REFERENCE_NAVIGATION -->', navigation)
  .replace('<!-- REFERENCE_CONTENT -->', detailChapters)
  .replaceAll('REFERENCE_PACKAGE_COUNT', String(visiblePackages.length))
  .replaceAll('REFERENCE_SYMBOL_COUNT', String(symbolCount));

assertUniqueIds(output, 'reference');
writeFileSync(resolve(sourceRoot, 'docs/ref/index.html'), output);
rmSync(resolve(sourceRoot, 'docs/ref/packages'), { recursive: true, force: true });
rmSync(resolve(sourceRoot, 'docs/ref/indexable-packages.json'), { force: true });
console.log(`Generated ${symbolCount} public symbols from ${packages.length} packages.`);
console.log(
  `Documentation coverage: ${(documentationCoverage.declarationCoverage * 100).toFixed(1)}% declarations, ${(
    documentationCoverage.memberCoverage * 100
  ).toFixed(1)}% members.`,
);
