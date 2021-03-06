/** @jsx h */
import { VNode } from 'preact';
import { Suspense, useMemo } from 'preact/compat';
import {
  GraphDomain,
  useGraphNodeResource,
  useGraphNodeState,
} from 'preact-graph-state';
import { node } from 'graph-state';
import { swr } from 'swr-graph-state';

const API = 'https://dog.ceo/api/breed/';
const API_SUFFIX = '/images/random';

interface APIResult {
  message: string;
  status: string;
}

const dogBreed = node({
  get: 'shiba',
});

const dogAPI = swr<APIResult>({
  key: 'dogAPI',
  setup: ({ get }) => {
    const breed = get(dogBreed);
    return async () => {
      const response = await fetch(`${API}${breed}${API_SUFFIX}`);
      if (response.ok) {
        return (await response.json()) as APIResult;
      }
      throw new Error('Not found');
    };
  },
  revalidateOnFocus: true,
  revalidateOnNetwork: true,
});

function DogImage(): VNode {
  const data = useGraphNodeResource(dogAPI.resource);

  return <img src={data.message} alt={data.message} />;
}

function debounce<P extends any[] = []>(callback: (...args: P) => void): (...args: P) => void {
  let timeout: number;
  return (...args): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      callback(...args);
    });
  };
}

function SetBreed(): JSX.Element {
  const [state, setState] = useGraphNodeState(dogBreed);

  const onChange = useMemo(() => debounce((value: string) => {
    setState(value);
  }), [setState]);

  return (
    <input
      type="text"
      value={state}
      onChange={(e) => {
        onChange(e.currentTarget.value);
      }}
    />
  );
}

function Trigger(): VNode {
  return (
    <button
      type="button"
      onClick={() => {
        dogAPI.trigger();
      }}
    >
      Trigger
    </button>
  );
}

export default function App(): VNode {
  return (
    <GraphDomain>
      <Trigger />
      <SetBreed />
      <p>
        Pressing the Trigger button revalidates the image below.
      </p>
      <div>
        <Suspense fallback={<h1>Loading...</h1>}>
          <DogImage />
        </Suspense>
        <p>
          Image above will automatically update when the page
          gets re-focused or network goes back online.
        </p>
        <p>
          Image response has a fresh age of 2 seconds and a stale age of 30 seconds.
        </p>
      </div>
    </GraphDomain>
  );
}
