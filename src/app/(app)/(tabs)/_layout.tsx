import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import CustomHeader from '../../../components/ui/CustomHeader';
import { Colors, FontSize } from '../../../constants/theme';

type TabIconProps = { emoji: string; focused: boolean };

function TabIcon({ emoji, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <CustomHeader title={getTitleForRoute(route.name)} />,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: 'Files',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

function getTitleForRoute(name: string): string {
  const map: Record<string, string> = {
    home: 'StickyBook',
    search: 'Search',
    files: 'Files',
    profile: 'Profile',
  };
  return map[name] ?? name;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: { backgroundColor: Colors.primary + '22' },
  emoji: { fontSize: 18 },
});
