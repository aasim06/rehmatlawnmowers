// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import usePermission from 'hooks/usePermission';

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation() {
  const { hasAccessToItem, isSuperAdmin } = usePermission();

  const navGroups = menuItem.items.map((item) => {
    let filteredItem = { ...item };

    if (item.children) {
      filteredItem.children = item.children
        .map((child) => {
          if (child.children) {
            // Handle collapsed menu group (e.g. Machine Management)
            const allowedSub = child.children.filter((sub) => hasAccessToItem(sub));
            if (allowedSub.length === 0) return null;
            return { ...child, children: allowedSub };
          }
          return hasAccessToItem(child) ? child : null;
        })
        .filter(Boolean);
    }

    switch (filteredItem.type) {
      case 'group':
        return <NavGroup key={filteredItem.id} item={filteredItem} />;
      default:
        return (
          <Typography key={filteredItem.id} variant="h6" sx={{ color: 'error.main', textAlign: 'center' }}>
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
