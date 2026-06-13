/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays fallback UI
 */

import React, { ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    // TODO: Send to error logging service in production
  }

  retry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}): ReactNode {
  const colors = useColors();

  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="items-center gap-4">
          {/* Error Icon */}
          <Text className="text-6xl">⚠️</Text>

          {/* Error Title */}
          <Text className="text-2xl font-bold text-foreground text-center">
            Oops! Something went wrong
          </Text>

          {/* Error Message */}
          <View className="bg-surface rounded-lg p-4 border border-error w-full">
            <Text className="text-error font-semibold mb-2">Error Details:</Text>
            <Text className="text-muted text-sm font-mono">
              {error.message || 'Unknown error'}
            </Text>
          </View>

          {/* Error Stack (Development Only) */}
          {__DEV__ && error.stack && (
            <View className="bg-surface rounded-lg p-4 w-full max-h-40">
              <Text className="text-muted text-xs font-mono">
                {error.stack}
              </Text>
            </View>
          )}

          {/* Retry Button */}
          <Pressable
            className="bg-primary rounded-lg py-3 px-6 w-full items-center mt-4"
            onPress={retry}
          >
            <Text className="text-background font-semibold">Try Again</Text>
          </Pressable>

          {/* Help Text */}
          <Text className="text-muted text-sm text-center">
            If the problem persists, please restart the app or contact support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Screen Error Boundary (for wrapping entire screens)
 */
export function ScreenErrorBoundary({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <DefaultErrorFallback error={error} retry={retry} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
