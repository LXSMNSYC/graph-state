import React, { Suspense } from 'react';
import {
  resource,
  node,
} from 'graph-state';
import {
  GraphDomain,
  useGraphNodeResource,
  useGraphNodeValue,
  useGraphNodeState,
  useGraphNodeReset,
  useGraphNodeHydrate,
} from 'react-graph-state';

const temperatureF = node({
  key: 'Fahrenheit',
  get: 32,
});

const temperatureC = node<number, number, void>({
  key: 'Celsius',
  get: ({ get }) => {
    const fahrenheit = get(temperatureF);

    return ((fahrenheit - 32) * 5) / 9;
  },
  set: ({ set }, newValue) => set(temperatureF, (newValue * 9) / 5 + 32),
});

const sleep = (time: number) => new Promise((resolve) => {
  setTimeout(resolve, time, true);
});

const temperature = node<Promise<string>>({
  key: 'Temperature',
  get: async ({ get }) => {
    const fahrenheit = get(temperatureF);
    const celsius = get(temperatureC);

    await sleep(1000);

    return `${fahrenheit} vs ${celsius}`;
  },
});

const asyncTemperature = resource(temperature);

function ResetTemperature(): JSX.Element {
  const resetTemperature = useGraphNodeReset(temperatureF);

  return (
    <button type="button" onClick={resetTemperature}>
      Reset
    </button>
  );
}

function Celsius(): JSX.Element {
  const [celsius, setCelsius] = useGraphNodeState(temperatureC);

  return (
    <input
      type="number"
      onChange={(e: React.FormEvent<HTMLInputElement>) => (
        setCelsius(Number.parseFloat(e.currentTarget.value))
      )}
      value={celsius}
    />
  );
}

function Fahrenheit(): JSX.Element {
  const [fahrenheit, setFahrenheit] = useGraphNodeState(temperatureF);

  return (
    <input
      type="number"
      onChange={(e: React.FormEvent<HTMLInputElement>) => (
        setFahrenheit(Number.parseFloat(e.currentTarget.value))
      )}
      value={fahrenheit}
    />
  );
}

function Temperature(): JSX.Element {
  const celsius = useGraphNodeValue(temperatureC);
  const fahrenheit = useGraphNodeValue(temperatureF);

  return (
    <>
      <h1>{`Fahrenheit: ${fahrenheit}`}</h1>
      <h1>{`Celsius: ${celsius}`}</h1>
    </>
  );
}

function DelayedTemperature(): JSX.Element {
  const value = useGraphNodeResource(asyncTemperature);

  return <h1>{ value }</h1>;
}

function AsyncTemperature(): JSX.Element {
  const value = useGraphNodeValue(asyncTemperature);

  if (value.status === 'pending') {
    return <h1>Loading...</h1>;
  }
  if (value.status === 'failure') {
    return <h1>Something went wrong.</h1>;
  }
  return <h1>{ value.data }</h1>;
}

const timer = node<number>({
  key: 'Timer',
  get: ({ mutateSelf, subscription }) => {
    let count = 0;
    subscription(() => {
      const interval = setInterval(() => {
        count += 1;
        mutateSelf(count);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    });
    return count;
  },
});

function Timer(): JSX.Element {
  const value = useGraphNodeValue(timer);

  return <h1>{`Time: ${value}`}</h1>;
}

function InnerApp(): JSX.Element {
  useGraphNodeHydrate(temperatureF, 100);

  return (
    <>
      <Fahrenheit />
      <Celsius />
      <ResetTemperature />
      <Temperature />
      <Suspense fallback={<h1>Loading...</h1>}>
        <DelayedTemperature />
      </Suspense>
      <AsyncTemperature />
      <Timer />
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <GraphDomain>
      <InnerApp />
    </GraphDomain>
  );
}
