// import * as React from "react";
// import AppBar from "@mui/material/AppBar";
// import Box from "@mui/material/Box";
// import Toolbar from "@mui/material/Toolbar";
// import IconButton from "@mui/material/IconButton";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import Avatar from "@mui/material/Avatar";
// import AccountCircle from "@mui/icons-material/AccountCircle";
// import { getToken } from "../services/localStorageService";
// import { logOut } from "../services/authenticationService";
// import "../Style/LogIn.css" ; 

// export default function Header() {
//   const [anchorEl, setAnchorEl] = React.useState(null);
//   const [user, setUser] = React.useState(null);

//   const isMenuOpen = Boolean(anchorEl);

//   // Lấy thông tin user Google (ảnh đại diện)
//   React.useEffect(() => {
//     const accessToken = getToken();
//     if (!accessToken) return;

//     fetch(
//       `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`
//     )
//       .then((res) => res.json())
//       .then((data) => setUser(data))
//       .catch(() => setUser(null));
//   }, []);

//   const handleProfileMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = () => {
//     handleMenuClose();
//     logOut();
//     window.location.href = "/login";
//   };

//   return (
//     <Box sx={{ flexGrow: 1 }}>
//       <AppBar position="fixed">
//         <Toolbar sx={{ justifyContent: "flex-end" }}>
//           {/* AVATAR GOOGLE */}
//           <IconButton
//             size="large"
//             edge="end"
//             aria-label="account of current user"
//             aria-haspopup="true"
//             onClick={handleProfileMenuOpen}
//             color="inherit"
//           >
//             {user?.picture ? (
//               <Avatar
//                 src={user.picture}
//                 alt={user.name}
//                 sx={{ width: 32, height: 32 }}
//               />
//             ) : (
//               <AccountCircle />
//             )}
//           </IconButton>

//           {/* MENU ACCOUNT */}
//           <Menu
//             anchorEl={anchorEl}
//             open={isMenuOpen}
//             onClose={handleMenuClose}
//             anchorOrigin={{
//               vertical: "top",
//               horizontal: "right",
//             }}
//             transformOrigin={{
//               vertical: "top",
//               horizontal: "right",
//             }}
//           >
//             <MenuItem disabled>
//               {user?.name || "Guest"}
//             </MenuItem>
//             <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
//             <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
//             <MenuItem onClick={handleLogout}>Log Out</MenuItem>
//           </Menu>
//         </Toolbar>
//       </AppBar>
//     </Box>
//   );
// }
