/** @jsx h */
import { h } from 'preact';
import { Suspense } from 'preact/compat';
import {
  act, cleanup, render, waitFor,
} from '@testing-library/preact';
import {
  node,
  resource,
  waitForAll,
} from 'graph-state';
import {
  GraphDomain,
  useGraphNodeResource,
  useGraphNodeValue,
} from '../src';

import { restoreWarnings, supressWarnings } from './suppress-warnings';
import ErrorBound from './error-boundary';

import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

const step = async () => {
  await act(() => {
    jest.advanceTimersByTime(1000);
  });
};

afterEach(cleanup);

const sleep = (count: number) => new Promise((resolve) => {
  setTimeout(resolve, count * 1000, true);
});

describe('waitForAll', () => {
  const resourceA = resource(
    node<Promise<string>>({
      get: async () => {
        await sleep(1);
        return 'Message A';
      },
    }),
  );
  const resourceB = resource(
    node<Promise<string>>({
      get: async () => {
        await sleep(2);
        return 'Message B';
      },
    }),
  );
  const resourceC = resource(
    node<Promise<string>>({
      get: async () => {
        await sleep(3);
        return 'Message C';
      },
    }),
  );
  const resourceF = resource<string>(
    node<Promise<string>>({
      get: (): Promise<string> => Promise.reject(new Error('Message F')),
    }),
  );

  describe('useGraphNodeValue', () => {
    it('should receive a pending state on initial render.', () => {
      const finder = 'example';
      const expected = 'Pending';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(values);

        return (
          <p title={finder}>
            {
              value.status === 'pending' ? expected : undefined
            }
          </p>
        );
      }

      const result = render(
        <GraphDomain>
          <Consumer />
        </GraphDomain>,
      );

      expect(result.getByTitle(finder)).toContainHTML(expected);
    });
    it('should receive a pending state on until all resources has settled.', async () => {
      const finder = 'example';
      const expected = 'Pending';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(values);

        return (
          <p title={finder}>
            {
              value.status === 'pending' ? expected : undefined
            }
          </p>
        );
      }

      const result = render(
        <GraphDomain>
          <Consumer />
        </GraphDomain>,
      );

      expect(result.getByTitle(finder)).toContainHTML(expected);
      await step();
      expect(result.getByTitle(finder)).toContainHTML(expected);
      await step();
      expect(result.getByTitle(finder)).toContainHTML(expected);
    });
    it('should receive a success state when all resources has settled.', async () => {
      const expected = 'Message A, Message B, Message C';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(values);

        return (
          <p title={value.status}>
            {
              value.status === 'success' ? value.data.join(', ') : undefined
            }
          </p>
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

      expect(await waitFor(() => result.getByTitle('success'))).toContainHTML(expected);
    });
    it('should receive a failure state upon rejection.', async () => {
      const values = waitForAll([
        resourceA,
        resourceF,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(values);

        return (
          <p title={value.status}>
            {
              value.status === 'failure' ? 'Error' : undefined
            }
          </p>
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

      expect(await waitFor(() => result.getByTitle('failure'))).toContainHTML('Error');
    });
  });

  describe('useGraphNodeResource', () => {
    it('should receive a pending state on initial render.', () => {
      const finder = 'example';
      const expected = 'Pending';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(values);

        return <p title="success">{ value }</p>;
      }

      function Pending(): JSX.Element {
        return <p title={finder}>Pending</p>;
      }

      const result = render(
        <GraphDomain>
          <Suspense fallback={<Pending />}>
            <Consumer />
          </Suspense>
        </GraphDomain>,
      );

      expect(result.getByTitle(finder)).toContainHTML(expected);
    });
    it('should receive a pending state on until all resources has settled.', async () => {
      const finder = 'example';
      const expected = 'Pending';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(values);

        return <p title="success">{ value }</p>;
      }

      function Pending(): JSX.Element {
        return <p title={finder}>Pending</p>;
      }

      const result = render(
        <GraphDomain>
          <Suspense fallback={<Pending />}>
            <Consumer />
          </Suspense>
        </GraphDomain>,
      );

      expect(result.getByTitle(finder)).toContainHTML(expected);
      await step();
      expect(result.getByTitle(finder)).toContainHTML(expected);
      await step();
      expect(result.getByTitle(finder)).toContainHTML(expected);
    });
    it('should receive a success state when all resources has settled.', async () => {
      const expected = 'Message A, Message B, Message C';

      const values = waitForAll([
        resourceA,
        resourceB,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(values);

        return <p title="success">{ value.join(', ') }</p>;
      }

      function Pending(): JSX.Element {
        return <p title="pending">Pending</p>;
      }

      const result = render(
        <GraphDomain>
          <Suspense fallback={<Pending />}>
            <Consumer />
          </Suspense>
        </GraphDomain>,
      );

      await act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('success'))).toContainHTML(expected);
    });
    it('should receive a failure state upon rejection.', async () => {
      const values = waitForAll([
        resourceA,
        resourceF,
        resourceC,
      ]);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(values);

        return <p title="success">{ value.join(', ') }</p>;
      }

      function Pending(): JSX.Element {
        return <p title="pending">Pending</p>;
      }

      function Failure(): JSX.Element {
        return <p title="failure">Error</p>;
      }

      supressWarnings();
      const result = render(
        <GraphDomain>
          <ErrorBound fallback={<Failure />}>
            <Suspense fallback={<Pending />}>
              <Consumer />
            </Suspense>
          </ErrorBound>
        </GraphDomain>,
      );

      await act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('failure'))).toContainHTML('Error');
      restoreWarnings();
    });
  });
});
