/** @jsx h */
import { Fragment, h } from 'preact';
import {
  act, cleanup, fireEvent, render,
} from '@testing-library/preact';
import {
  node,
} from 'graph-state';
import {
  GraphDomain,
  useGraphNodeDispatch,
  useGraphNodeValue,
} from '../src';
import { supressWarnings, restoreWarnings } from './suppress-warnings';

import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  cleanup();
});

describe('useGraphNodeValue', () => {
  it('should receive the value supplied by the node.', async () => {
    const expected = 'Hello World';
    const finder = 'example';

    const exampleNode = node({
      get: expected,
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should receive the value supplied by the dependency node.', async () => {
    const expected = 'Hello World';
    const finder = 'example';

    const exampleNode = node({
      get: expected,
    });

    const exampleNode2 = node<string>({
      get: ({ get }) => get(exampleNode),
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode2);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should re-render if the graph node value changes', async () => {
    const finder = 'example';
    const expected = 'Changed';

    const exampleNode = node<string>({
      get: ({ mutateSelf }) => {
        setTimeout(mutateSelf, 1000, expected);

        return 'Result';
      },
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should re-render if the dependency graph node value changes', async () => {
    const finder = 'example';
    const expected = 'Changed';

    const exampleNode = node<string>({
      get: ({ mutateSelf }) => {
        setTimeout(mutateSelf, 1000, expected);

        return 'Result';
      },
    });

    const exampleNode2 = node<string>({
      get: ({ get }) => get(exampleNode),
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode2);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should throw an error if the graph domain is not mounted before accessing.', () => {
    const exampleNode = node({
      get: 'Example',
    });

    function Consumer(): JSX.Element {
      useGraphNodeValue(exampleNode);

      return <Fragment>Test</Fragment>;
    }

    supressWarnings();
    expect(() => {
      render(<Consumer />);
    }).toThrowError();
    restoreWarnings();
  });
});

describe('useGraphNodeDispatch', () => {
  it('should re-render the consumer components of the node', async () => {
    const expected = 'Changed';
    const finder = 'example';

    const exampleNode = node({
      get: 'Initial',
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    function Updater(): JSX.Element {
      const update = useGraphNodeDispatch(exampleNode);

      return (
        <button
          type="button"
          onClick={() => update(expected)}
        >
          Update
        </button>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
        <Updater />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    fireEvent.click(result.getByText('Update'));

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should re-render the consumer components of the dependent node', async () => {
    const expected = 'Changed';
    const finder = 'example';

    const exampleNode = node({
      get: 'Initial',
    });

    const exampleNode2 = node<string>({
      get: ({ get }) => get(exampleNode),
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode2);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    function Updater(): JSX.Element {
      const update = useGraphNodeDispatch(exampleNode);

      return (
        <button
          type="button"
          onClick={() => (
            update(expected)
          )}
        >
          Update
        </button>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
        <Updater />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    fireEvent.click(result.getByText('Update'));

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });
  it('should re-render the consumer components of the dependency node through side-effects', async () => {
    const expected = 'Changed';
    const finder = 'example';

    const exampleNode = node({
      get: 'Initial',
    });

    const exampleNode2 = node<string, string, void>({
      get: ({ get }) => get(exampleNode),
      set: ({ set }, newValue) => set(exampleNode, newValue),
    });

    function Consumer(): JSX.Element {
      const value = useGraphNodeValue(exampleNode);

      return (
        <p title={finder}>{ value }</p>
      );
    }

    function Updater(): JSX.Element {
      const update = useGraphNodeDispatch(exampleNode2);

      return (
        <button
          type="button"
          onClick={() => update(expected)}
        >
          Update
        </button>
      );
    }

    const result = render(
      <GraphDomain>
        <Consumer />
        <Updater />
      </GraphDomain>,
    );

    await act(() => {
      jest.runAllTimers();
    });

    fireEvent.click(result.getByText('Update'));

    await act(() => {
      jest.runAllTimers();
    });

    expect(result.getByTitle(finder)).toContainHTML(expected);
  });

  it('should throw an error if the graph domain is not mounted before accessing.', () => {
    const exampleNode = node({
      get: 'Example',
    });

    function Consumer(): JSX.Element {
      useGraphNodeDispatch(exampleNode);

      return <>Test</>;
    }

    supressWarnings();
    expect(() => {
      render(<Consumer />);
    }).toThrowError();
    restoreWarnings();
  });
});
