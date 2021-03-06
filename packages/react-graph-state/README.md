# react-graph-state

> React bindings for `graph-state`

[![NPM](https://img.shields.io/npm/v/react-graph-state.svg)](https://www.npmjs.com/package/react-graph-state) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/graph-state/tree/main/examples/react-graph-state)

## Install

```bash
yarn add graph-state react-graph-state
```

```bash
npm install graph-state react-graph-state
```

## Usage

### Accessing a graph node

Graph nodes, by themselves, are meaningless. They needed a domain to begin computing. `<GraphDomain>` is a component that defines such domain where all graph nodes live.

```tsx
import { GraphDomain } from 'react-graph-state`;

const messageNode = node({
  get: 'Hello World',
});

function App() {
  return (
    <GraphDomain>
      {/* children */}
    </GraphDomain>
  );
}
```

There are also 8 hooks:

- `useGraphNodeValue`: reads a graph node's value. Subscribes to the graph node's state updates.
- `useGraphNodeDispatch`: provides a callback that allows graph node's state mutation or runs `set` field.
- `useGraphNodeReset`: provides a callback for resetting (recomputing) a graph node's value.
- `useGraphNodeState`: a combination of `useGraphNodeValue`, `useGraphNodeDispatch` and `useGraphNodeReset` in a form of a tuple.
- `useGraphNodeHydrate`: hydrates a node instance with a given initial state, then resets the node after commit. Useful for prefetched data.
- `useGraphNodeResource`: treats the graph node as a valid Preact resource, suspending the component if the graph node's resource is pending.
- `useGraphNodeSnapshot`: attaches a listener to the node for state updates.
- `useGraphNodeMutate`: provides a callback that allows graph node's state mutation.
- `useGraphNodeSelector`: similar to `useGraphNodeValue`, but allows transformation of received value and conditional re-rendering.

If one of these hooks are used to access a graph node, that graph node is registered within `<GraphDomain>` and creates a lifecycle.

#### Hooks

##### `useGraphNodeValue`

This is a React hook that reads the graph node's current state and subscribes to further state updates.

```tsx
function Message() {
  const message = useGraphNodeValue(messageNode);

  return <h1>{ message }</h1>;
}
```

##### `useGraphNodeDispatch`

This is a React hook that returns a callback similar to `setState` that allows state mutation for the given graph node.

```tsx
function MessageInput() {
  const setMessage = useGraphNodeDispatch(messageNode);

  const onChange = useCallback((e) => {
    setFahrenheit(Number.parseFloat(e.currentTarget.value));
  }, []);

  return (
    <input
      type="text"
      onChange={onChange}
    />
  );
}
```

If a graph node has a defined `set` function, `useGraphNodeDispatch` will not overwrite the graph node's state and thus, can accept any kind of value for dispatch. `set` will receive this value, allowing for custom graph node logic:

```tsx
const countNode = node({
  get: 0,
});

const reducerNode = node({
  get: ({ get }) => get(countNode),
  set: ({ set }, action) => {
    switch (action) {
      case 'INCREMENT':
        set(countNode, get(countNode) + 1);
        break;
      case 'DECREMENT':
        set(countNode, get(countNode) - 1);
        break;
    }
  },
});

// ...
const dispatch = useGraphNodeDispatch(reducerNode);

// ...
dispatch('INCREMENT');
```

##### `useGraphNodeReset`

This is a hook that provides a callback for resetting a graph node.

```tsx
const reset = useGraphNodeReset(countNode);

// ...
reset(); // resets countNode back to 0
```

##### `useGraphNodeState`

This is a hook that returns a tuple based on `useGraphNodeValue`, `useGraphNodeDispatch` and `useGraphNodeReset`.

```tsx
const [count, setCount, reset] = useGraphNodeState(countNode);
```

##### `useGraphNodeSnapshot`

This is a hook that attaches a listener to a graph node and subscribes for state updates.

```tsx
useGraphNodeSnapshot(node, (state) => {
  console.log('Received', state);
});
```

##### `useGraphNodeMutate`

This is a hook that returns a callback similar to `setState` that allows state mutation for the given graph node.

```tsx
const setState = useGraphNodeMutate(node);

// Rewrite!
setState(newState);

// Derived
setState((prevState) => diff(prevState, newState));
```

##### `useGraphNodeHydrate`

**USE WITH CAUTION**
Synchronously and silently mutates a graph node's state. This is only recommended for independent nodes as a form of lazy state hydration.

```tsx
useGraphNodeHydrate(countNode, 100);
```

##### `useGraphNodeSelector`

Similar to `useGraphNodeValue` but allows transformation of received value and conditional re-rendering.

```tsx
const name = useGraphNodeSelector(userNode, {
  getSnapshot: (value) => {
    return value.name;
  },
  shouldUpdate: (prev, next) => {
    return prev !== next;
  },
});
```

##### `useGraphNodeResource`

This is a hook that receives a valid graph node resource and suspends the component until the resource is successful. This may resuspend the component if the resource updates itself.

### Graph Node Resources

Accessing graph node resources using `useGraphNodeValue` returns an object which represents the Promise result.

```tsx
function UserProfile() {
  const result = useGraphNodeValue(userResourceNode);

  if (result.status === 'pending') {
    return <h1>Loading...</h1>;
  }
  if (result.status === 'failure') {
    return <h1>Something went wrong.</h1>;
  }
  return <UserProfileInternal data={result.data} />;
}
```

There's also another hook called `useGraphNodeResource` which allows us to suspend the component until the resource is successful.

```tsx
function UserProfileInternal() {
  const data = useGraphNodeResource(userResourceNode);

  return (
    <UserProfileContainer>
      <UserProfileName>{ data.name }</UserProfileName>
      <UserProfileDescription>{ data.description }</UserProfileDescription>
    </UserProfile>
  );
}

function UserProfile() {
  return (
    <ErrorBoundary fallback={<h1>Something went wrong.</h1>}>
      <Suspense fallback={<h1>Loading...</h1>}>
        <UserProfileInternal />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
