import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

import HomeScreen from '../screens/home/HomeScreen';
import BookshelfScreen from '../screens/bookshelf/BookshelfScreen';
import CharactersScreen from '../screens/characters/CharactersScreen';
import AdventureScreen from '../screens/adventure/AdventureScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ParentControlScreen from '../screens/settings/ParentControlScreen';
import GodotGameScreen from '../screens/settings/GodotGameScreen';

import StoryCreateScreen from '../screens/story/StoryCreateScreen';
import BookDetailScreen from '../screens/story/BookDetailScreen';
import StoryDirectorScreen from '../screens/story/StoryDirectorScreen';
import ChapterScreen from '../screens/chapter/ChapterScreen';
import ShareScreen from '../screens/share/ShareScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ name, focused, color }) => {
  const icons = {
    Home: '🏠',
    Bookshelf: '📚',
    Characters: '🎭',
    Adventure: '🗺️',
    Settings: '⚙️',
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24 }}>{icons[name]}</Text>
    </View>
  );
};

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="StoryCreate" component={StoryCreateScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
      <Stack.Screen name="StoryDirector" component={StoryDirectorScreen} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
    </Stack.Navigator>
  );
};

const BookshelfStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookshelfMain" component={BookshelfScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
      <Stack.Screen name="StoryDirector" component={StoryDirectorScreen} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
      <Stack.Screen name="StoryCreate" component={StoryCreateScreen} />
    </Stack.Navigator>
  );
};

const CharactersStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CharactersMain" component={CharactersScreen} />
    </Stack.Navigator>
  );
};

const AdventureStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdventureMain" component={AdventureScreen} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
    </Stack.Navigator>
  );
};

const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="ParentControl" component={ParentControlScreen} />
      <Stack.Screen name="GodotGame" component={GodotGameScreen} />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: COLORS.legoBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="Bookshelf" 
        component={BookshelfStack}
        options={{ tabBarLabel: '书架' }}
      />
      <Tab.Screen 
        name="Characters" 
        component={CharactersStack}
        options={{ tabBarLabel: '角色' }}
      />
      <Tab.Screen 
        name="Adventure" 
        component={AdventureStack}
        options={{ tabBarLabel: '冒险' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
