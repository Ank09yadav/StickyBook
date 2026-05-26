import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/ui/CustomDrawerContent';
import { Colors } from '../../constants/theme';

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: Colors.surface, width: 280 },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{ drawerLabel: 'Main', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer>
  );
}
