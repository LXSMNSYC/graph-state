import React, { Suspense } from 'react';
import {
  act,
  cleanup,
  render,
  waitFor,
} from '@testing-library/react';
import {
  node,
  resource,
} from 'graph-state';
import {
  GraphDomain,
  useGraphNodeResource,
  useGraphNodeValue,
} from '../src';

import ErrorBound from './error-boundary';
import { restoreWarnings, supressWarnings } from './suppress-warnings';

import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  cleanup();
});

const sleep = (count: number) => new Promise((resolve) => {
  setTimeout(resolve, count * 1000, true);
});

describe('resource', () => {
  describe('useGraphNodeValue', () => {
    it('should receive a pending state on initial render.', () => {
      const finder = 'example';
      const expected = 'Pending';

      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          return 'Hello World';
        },
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(exampleResource);

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
    it('should receive a success state upon resolution.', async () => {
      const expected = 'Hello World';

      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          return expected;
        },
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(exampleResource);
        return (
          <p title={value.status}>
            {
              value.status === 'success' ? value.data : undefined
            }
          </p>
        );
      }

      const result = render(
        <GraphDomain>
          <Consumer />
        </GraphDomain>,
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('success'))).toContainHTML(expected);
    });
    it('should receive a failure state upon rejection.', async () => {
      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          throw new Error('failed');
        },
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeValue(exampleResource);

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

      act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('failure'))).toContainHTML('Error');
    });
  });
  describe('useGraphNodeResource', () => {
    it('should receive a pending state on initial render.', () => {
      const finder = 'example';
      const expected = 'Pending';

      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          return 'Hello World';
        },
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(exampleResource);

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
    it('should receive a success state upon resolution.', async () => {
      const expected = 'Hello World';

      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          return expected;
        },
        key: 'Example',
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(exampleResource);

        return <p title="success">{ value }</p>;
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

      act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('success'))).toContainHTML(expected);
    });
    it('should receive a failure state upon rejection.', async () => {
      const exampleAsync = node({
        get: async () => {
          await sleep(1);
          throw new Error('failed');
        },
      });
      const exampleResource = resource(exampleAsync);

      function Consumer(): JSX.Element {
        const value = useGraphNodeResource(exampleResource);
        return <p title="success">{value}</p>;
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

      act(() => {
        jest.runAllTimers();
      });

      expect(await waitFor(() => result.getByTitle('failure'))).toContainHTML('Error');
      restoreWarnings();
    });
  });
});
