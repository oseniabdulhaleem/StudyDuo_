// toast.tsx
"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

export type ToastProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
};

// Constants
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  open: boolean;
};

// Action types
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

// ID generator
let count = 0;
const genId = () => (count = (count + 1) % Number.MAX_SAFE_INTEGER).toString();

// Action types
type Action =
  | { type: typeof actionTypes.ADD_TOAST; toast: ToasterToast }
  | { type: typeof actionTypes.UPDATE_TOAST; toast: Partial<ToasterToast> }
  | { type: typeof actionTypes.DISMISS_TOAST; toastId?: string }
  | { type: typeof actionTypes.REMOVE_TOAST; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

// Toast timeout management
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

// State management
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

// Toast component
export const ToastItem: React.FC<ToastProps> = ({
  open,
  onOpenChange,
  title,
  description,
  action,
}) => (
  <Toast.Root
    open={open}
    onOpenChange={onOpenChange}
    className="bg-white rounded-lg shadow-lg p-4 border border-gray-200"
  >
    {title && (
      <Toast.Title className="text-sm font-medium text-gray-900">
        {title}
      </Toast.Title>
    )}
    {description && (
      <Toast.Description className="mt-1 text-sm text-gray-500">
        {description}
      </Toast.Description>
    )}
    {action && (
      <Toast.Action asChild className="mt-2" altText="Close">
        {action}
      </Toast.Action>
    )}
    <Toast.Close
      className="absolute top-2 right-2 rounded-md text-gray-400 hover:text-gray-500"
      aria-label="Close"
    >
      ×
    </Toast.Close>
  </Toast.Root>
);

// Toast container
export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-full max-w-sm m-0 list-none z-50" />
    </Toast.Provider>
  );
};

// Hook and methods
type ToastInput = Omit<ToastProps, "id" | "open">;

function toast(props: ToastInput) {
  const id = genId();

  const update = (props: ToastProps) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast };
