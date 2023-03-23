import {
  ArrowPathIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Toolbar,
  ToolbarButton,
  TreeView,
  TreeItem,
} from "@wingconsole/design-system";
import type { Router } from "@wingconsole/server";
import classNames from "classnames";
import { useEffect, useState } from "react";

import { PlayAllIcon } from "../design-system/icons/index.js";
import { ScrollableArea } from "../design-system/ScrollableArea.js";
import { trpc } from "../utils/trpc.js";

export type TestStatus = "success" | "error" | "running" | "pending";

const getTestName = (testPath: string) => {
  const test = testPath.split("/").pop() ?? testPath;
  return test.replace(/test: /g, "");
};

export interface TestItem {
  id: string;
  label: string;
  status: TestStatus;
  time?: number;
  onRunAll?: () => void;
  runAllDisabled?: boolean;
}
export interface TestsTreeProps {
  onRunAll?: () => void;
  onRunTest?: (testPath: string) => void;
}

type RouterOutput = inferRouterOutputs<Router>;

export const TestsTree = ({ onRunAll, onRunTest }: TestsTreeProps) => {
  const [testTree, setTestTree] = useState<TestItem[]>([]);

  const testListQuery = trpc["test.list"].useQuery();
  useEffect(() => {
    if (!testListQuery.data) {
      return;
    }
    setTestTree(
      testListQuery.data.map((resourcePath) => {
        return {
          id: resourcePath,
          label: getTestName(resourcePath),
          status: "pending",
        };
      }),
    );
  }, [testListQuery.data]);

  const setTestStatus = (
    resourcePath: string,
    status: TestStatus,
    time?: number,
  ) => {
    setTestTree((testTree) => {
      return testTree.map((testItem) => {
        if (testItem.id === resourcePath) {
          return {
            ...testItem,
            status,
            time: time || testItem.time,
          };
        }
        return testItem;
      });
    });
  };

  const setAllTestStatus = (status: TestStatus, time?: number) => {
    setTestTree((testTree) => {
      return testTree.map((testItem) => {
        return {
          ...testItem,
          status,
          time: time || testItem.time,
        };
      });
    });
  };

  const onRunTestsSuccess = (runOutput: RouterOutput["test.run"][]) => {
    for (const output of runOutput) {
      setTestStatus(
        output.path,
        output.error ? "error" : "success",
        output.time,
      );
    }
  };

  const runAllTests = trpc["test.runAll"].useMutation({
    onMutate: () => {
      setAllTestStatus("running");
    },
    onSuccess: (data) => {
      onRunTestsSuccess(data);
      onRunAll?.();
    },
  });

  const runTest = trpc["test.run"].useMutation({
    onMutate: (data) => {
      setTestStatus(data.resourcePath, "running");
    },
    onSuccess: (data) => {
      onRunTestsSuccess([data]);
      onRunTest?.(data.path);
    },
  });

  return (
    <div className="w-full h-full flex flex-col" data-testid="test-tree-menu">
      <Toolbar title="Tests">
        <ToolbarButton
          onClick={() => runAllTests.mutate()}
          title="Run All Tests"
          disabled={testTree.length === 0}
        >
          <PlayAllIcon className="w-4 h-4 text-slate-600" />
        </ToolbarButton>
      </Toolbar>

      <div className="relative grow">
        <div className="absolute inset-0">
          <ScrollableArea
            overflowY
            className="h-full w-full text-sm text-slate-800 bg-slate-50 flex flex-col gap-1"
          >
            <div className="flex flex-col">
              {testTree.length === 0 && (
                <div className="text-slate-400 text-2xs px-3 py-2 font-mono">
                  No Tests
                </div>
              )}
              <TreeView>
                {testTree.map((test) => (
                  <TreeItem
                    key={test.id}
                    itemId={test.id}
                    label={
                      <div className="flex items-center gap-1">
                        <span className="truncate">{test.label}</span>
                        {test.time && (
                          <span className="text-slate-400 text-xs">
                            {test.time}ms
                          </span>
                        )}
                      </div>
                    }
                    secondaryLabel={
                      <div
                        className={classNames(
                          "hidden group-hover:flex items-center ",
                        )}
                      >
                        <ToolbarButton
                          title={`Run ${test.label}`}
                          onClick={() =>
                            runTest.mutate({
                              resourcePath: test.id,
                            })
                          }
                        >
                          <PlayIcon className="w-4 h-4 text-slate-500" />
                        </ToolbarButton>
                      </div>
                    }
                    title={test.label}
                    icon={
                      <>
                        {test.status === "success" && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                        {test.status === "error" && (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                        {test.status === "running" && (
                          <ArrowPathIcon className="w-4 h-4 text-slate-500 animate-spin" />
                        )}
                        {test.status === "pending" && (
                          <MinusCircleIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </>
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        runTest.mutate({
                          resourcePath: test.id,
                        });
                      }
                    }}
                  />
                ))}
              </TreeView>
            </div>
          </ScrollableArea>
        </div>
      </div>
    </div>
  );
};
