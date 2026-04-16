import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, AppState } from 'react-native';
import { RTNGodot } from '@borndotcom/react-native-godot';

const GodotGameScreen = ({ navigation }) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause game
        try {
          const Godot = RTNGodot.API();
          Godot.pause();
        } catch (error) {
          console.log('Pause error:', error);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      // Clean up Godot when unmounting
      try {
        const Godot = RTNGodot.API();
        Godot.quit();
      } catch (error) {
        console.log('Quit error:', error);
      }
    };
  }, []);

  const handleActionPress = (action) => {
    try {
      const Godot = RTNGodot.API();
      const Input = Godot.Input;
      Input.action_press(action);
    } catch (error) {
      console.log('Action press error:', error);
    }
  };

  const handleActionRelease = (action) => {
    try {
      const Godot = RTNGodot.API();
      const Input = Godot.Input;
      Input.action_release(action);
    } catch (error) {
      console.log('Action release error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← 返回</Text>
      </TouchableOpacity>

      <View style={styles.gameContainer}>
        <RTNGodot
          style={styles.godotView}
          onGodotMessage={(event) => {
            console.log('Godot message:', event.nativeEvent);
          }}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={() => handleActionPress('ui_left')}
          onPressOut={() => handleActionRelease('ui_left')}
        >
          <Text style={styles.controlText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={() => handleActionPress('ui_accept')}
          onPressOut={() => handleActionRelease('ui_accept')}
        >
          <Text style={styles.controlText}>跳</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPressIn={() => handleActionPress('ui_right')}
          onPressOut={() => handleActionRelease('ui_right')}
        >
          <Text style={styles.controlText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
  },
  godotView: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  controlText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GodotGameScreen;
