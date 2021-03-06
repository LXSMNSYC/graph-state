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
  GraphNode,
} from 'graph-state';
import {
  useMemoCondition,
} from '@lyonph/react-hooks';
import { useDebugValue } from 'react';
import { useStoreAdapter } from 'react-store-adapter';
import { useGraphDomainCore, useGraphDomainRestriction } from '../GraphDomainCore';

export interface UseSelectorOptions<T, R> {
  getSnapshot?: (value: T) => R;
  shouldUpdate?: (prev: R, next: R) => boolean;
}

function useGraphNodeSelector<S, A, R, T>(
  node: GraphNode<S, A, R>,
  options: UseSelectorOptions<S, T>,
): T {
  useGraphDomainRestriction();
  const context = useGraphDomainCore();
  const store = useMemoCondition(
    () => context.get(node),
    { context, node },
    (prev, next) => (
      !(Object.is(prev.context, next.context) && Object.is(prev.node, next.node))
    ),
  );

  const value = useStoreAdapter(store, options);

  useDebugValue(value);

  return value;
}

export default useGraphNodeSelector;
