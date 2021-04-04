/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import {
  memo,
  useDebugValue,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  createGraphDomainMemory,
  destroyGraphDomainMemory,
  GraphDomainMemory,
  Batcher,
} from 'graph-state';
import {
  useConstant,
  useConstantCallback,
} from '@lyonph/react-hooks';
import { useGraphDomainContext } from './GraphDomainContext';

function useGraphDomainCore() {
  const { current } = useGraphDomainContext();

  const batchedUpdates = useRef<(() => void)[]>([]);
  const [version, setVersion] = useState(0);

  const isMounted = useRef(true);
  const isEffect = useRef(false);

  const batchUpdate = useConstantCallback<Batcher>((callback) => {
    const update = () => {
      if (isMounted.current) {
        batchedUpdates.current.push(callback);

        setVersion((v) => v + 1);
      }
    };
    if (isEffect.current) {
      update();
    } else {
      setTimeout(update);
    }
  });

  const memory = useConstant<GraphDomainMemory>(
    () => createGraphDomainMemory(batchUpdate),
  );

  current.value = memory;

  useEffect(() => {
    const updates = batchedUpdates.current;

    batchedUpdates.current = [];

    if (updates.length > 0) {
      isEffect.current = true;
      updates.forEach((batchedUpdate) => {
        batchedUpdate();
      });
      isEffect.current = false;
    }
  }, [version]);

  useDebugValue(memory.nodes);

  useEffect(() => () => {
    isMounted.current = false;
    destroyGraphDomainMemory(memory);
  }, [memory]);
}

const GraphDomainCore = memo(() => {
  useGraphDomainCore();
  return null;
}, () => true);

export default GraphDomainCore;
