import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/bottom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false }} />
      <Tabs.Screen name="coins" options={{ headerShown: false }} />
      <Tabs.Screen 
        name="add" 
        options={{ 
          headerShown: false,
          // This screen is just a placeholder for the button in the tab bar
          // The modal logic is handled in the BottomTabBar component
        }} 
        listeners={{
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen name="savings" options={{ headerShown: false }} />
      <Tabs.Screen name="profile" options={{ headerShown: false }} />
      
      {/* Hidden tabs or other screens that shouldn't appear in the tab bar but are part of the tabs layout */}
      <Tabs.Screen name="budgets" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
