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
import React, { memo, useDebugValue } from 'react';
import { useDisposableMemo } from 'use-dispose';
import {
  createGraphDomainInterface,
  createGraphDomainScheduler,
  createGraphDomainMemory,
  GraphDomainScheduler,
  GraphDomainMemory,
  Work,
  performWorkLoop,
  cleanDomainMemory,
  GraphNodeDraftState,
  GraphNode,
  GraphNodeKey,
} from 'graph-state';
import {
  createExternalSubject,
  ExternalSubject,
} from 'react-external-subject';
import useConstant from './hooks/useConstant';
import useIsomorphicEffect from './hooks/useIsomorphicEffect';
import { useGraphDomainContext } from './GraphDomainContext';
import useWorkQueue from './hooks/useWorkQueue';
import { GraphCoreInterface } from './types';

function useGraphCoreProcess() {
  const { current } = useGraphDomainContext();
  const [workQueue, scheduleWork, resetWork] = useWorkQueue<Work<any, any>>();

  const memory = useDisposableMemo<GraphDomainMemory>(
    createGraphDomainMemory,
    // Component renders twice before side-effects and commits run.
    // Dispose the current memory to prevent leaks to external sources.
    cleanDomainMemory,
  );
  const subjects = useConstant<Map<GraphNodeKey, ExternalSubject<any>>>(() => (
    new Map()
  ));
  const scheduler = useConstant<GraphDomainScheduler>(
    () => createGraphDomainScheduler(scheduleWork),
  );
  const methods = useConstant<GraphCoreInterface>(
    () => {
      const logic = createGraphDomainInterface(memory, scheduler);
      return {
        ...logic,
        getSubject: <S, A = GraphNodeDraftState<S>>(node: GraphNode<S, A>) => {
          const subject = subjects.get(node.key);
          if (subject) {
            return subject as ExternalSubject<S>;
          }
          const newSubject = createExternalSubject({
            read: () => logic.getState(node),
            subscribe: (handler) => {
              logic.addListener(node, handler);
              return () => {
                logic.removeListener(node, handler);
              };
            },
          });
          subjects.set(node.key, newSubject);
          return newSubject;
        },
      };
    },
  );

  current.value = methods;

  useIsomorphicEffect(() => {
    let raf: number;
    const loop = () => {
      performWorkLoop(
        memory,
        scheduler,
        methods,
        workQueue.current,
        resetWork,
      );

      raf = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(raf);
      cleanDomainMemory(memory);
    };
  }, []);

  useDebugValue(memory.state);
}

function GraphCoreProcess(): JSX.Element {
  useGraphCoreProcess();
  return <></>;
}

const GraphCore = memo(GraphCoreProcess, () => true);

export default GraphCore;
