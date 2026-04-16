declare module '@borndotcom/react-native-godot' {
  import { ViewProps } from 'react-native';

  export interface RTNGodotProps extends ViewProps {
    onGodotMessage?: (event: { nativeEvent: any }) => void;
  }

  export class RTNGodot extends React.Component<RTNGodotProps> {
    static API(): GodotAPI;
  }

  export interface GodotAPI {
    Input: GodotInput;
    pause(): void;
    quit(): void;
  }

  export interface GodotInput {
    action_press(action: string): void;
    action_release(action: string): void;
  }
}

declare function runOnGodotThread(callback: () => void): void;
