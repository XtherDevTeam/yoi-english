import React from "react";
import Api from "../Api"
import * as Mui from '../Components'
import Dialog from "./InputDialog";
import { Input } from "@mui/material";



const Profile = () => {
  const [userInfo, setUserInfo] = React.useState({
    id: 0,
    username: "",
    email: "",
    capabilities: {
      administrator: false
    }
  });
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({ type: "success", title: "", message: "" });

  const [inputDialogProps, setInputDialogProps] = React.useState({
    open: false,
    title: "",
    description: "",
    hint: "",
    defaultValue: "",
    onClose: () => { setInputDialogProps({ ...inputDialogProps, open: false }) },
    onSave: (value) => { }
  });
  const [passwordConfirmationDialogProps, setPasswordConfirmationDialogProps] = React.useState({
    open: false,
    onClose: () => { setPasswordConfirmationDialogProps({ ...passwordConfirmationDialogProps, open: false }) },
    onSave: () => { },
    onErr: () => { }
  });


  React.useEffect(() => {
    Api.userInfo().then(r => {
      if (r.status) {
        setUserInfo(r.data);
      } else {
        setAlertDetail({ type: "error", title: "Error", message: r.data });
        setAlertOpen(true);
      }
    }).catch(e => {
      console.error(e);
      setAlertDetail({ type: "error", title: "Error", message: "Failed to fetch user information" });
      setAlertOpen(true);
    })
  }, [])

  return <>
    <Mui.Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => { setAlertOpen(false) }}>
      <Mui.Alert severity={alertDetail.type} action={
        <Mui.IconButton aria-label="close" color="inherit" size="small" onClick={() => { setAlertOpen(false) }} >
          <Mui.Icons.Close fontSize="inherit" />
        </Mui.IconButton>
      }>
        <Mui.AlertTitle>{alertDetail.title}</Mui.AlertTitle>
        {alertDetail.message}
      </Mui.Alert>
    </Mui.Snackbar>
    <Dialog.InputDialog {...inputDialogProps} />
    <Dialog.PasswordConfirmationDialog {...passwordConfirmationDialogProps} />
    <Mui.CardMedia
      sx={{ height: "240px" }}
      image={Mui.headimg}
      title={userInfo.username}
    />
    <Mui.CardContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs="auto">
          <Mui.Avatar sx={{ height: "50px", width: "50px" }} alt={userInfo.username} src={Api.avatar(userInfo.id)} />
        </Mui.Grid>
        <Mui.Grid item xs="auto">
          <Mui.Typography variant="h6">
            {userInfo.username}
          </Mui.Typography>
          <Mui.Typography variant="body2" color="text.secondary">
            {userInfo.capabilities.administrator ? "Administrator" : "User"}
          </Mui.Typography>
        </Mui.Grid>
      </Mui.Grid>
      <Mui.Box sx={{ marginTop: "10px", width: "100%", borderBottom: 1, borderColor: 'divider' }}>
        <Mui.List style={{ width: "100%" }}>
          <Mui.ListItemButton onClick={() => {
            setInputDialogProps({
              open: true,
              title: "Change Username",
              description: "Enter a new username",
              hint: "Username",
              defaultValue: userInfo.username,
              onSave: (value) => {
                Api.updateUsername(value).then(r => {
                  if (r.status) {
                    setUserInfo({ ...userInfo, username: value });
                    setAlertDetail({ type: "success", title: "Success", message: "Username updated successfully" });
                    setAlertOpen(true);
                  } else {
                    setAlertDetail({ type: "error", title: "Error", message: r.message });
                    setAlertOpen(true);
                  }
                }).catch(e => {
                  console.error(e);
                  setAlertDetail({ type: "error", title: "Error", message: "Failed to update username" });
                  setAlertOpen(true);
                })
              },
              onClose: () => { setInputDialogProps({ ...inputDialogProps, open: false }) }
            })
          }}>
            <Mui.ListItemIcon><Mui.Icons.Person /></Mui.ListItemIcon>
            <Mui.ListItemText primary="Username" secondary={userInfo.username} />
          </Mui.ListItemButton>
          <Mui.ListItemButton onClick={() => {
            setInputDialogProps({
              open: true,
              title: "Change Email",
              description: "Enter a new email",
              hint: "Email",
              defaultValue: userInfo.email,
              onSave: (value) => {
                Api.updateEmail(value).then(r => {
                  if (r.status) {
                    setUserInfo({ ...userInfo, email: value });
                    setAlertDetail({ type: "success", title: "Success", message: "Email updated successfully" });
                    setAlertOpen(true);
                  } else {
                    setAlertDetail({ type: "error", title: "Error", message: r.message });
                    setAlertOpen(true);
                  }
                }).catch(e => {
                  console.error(e);
                  setAlertDetail({ type: "error", title: "Error", message: "Failed to update email" });
                  setAlertOpen(true);
                })
              },
              onClose: () => { setInputDialogProps({ ...inputDialogProps, open: false }) }
            })
          }}>
            <Mui.ListItemIcon><Mui.Icons.Email /></Mui.ListItemIcon>
            <Mui.ListItemText primary="Email" secondary={userInfo.email} />
          </Mui.ListItemButton>
          <Mui.ListItemButton onClick={() => {
            setPasswordConfirmationDialogProps({
              open: true,
              onClose: () => { setPasswordConfirmationDialogProps({ ...passwordConfirmationDialogProps, open: false }) },
              onSave: (password, newPassword) => {
                Api.updatePassword(password, newPassword).then(r => {
                  if (r.status) {
                    setAlertDetail({ type: "success", title: "Success", message: "Password updated successfully" });
                    setAlertOpen(true);
                  } else {
                    setAlertDetail({ type: "error", title: "Error", message: r.message });
                    setAlertOpen(true);
                  }
                }).catch(e => {
                  console.error(e);
                  setAlertDetail({ type: "error", title: "Error", message: `Failed to update password: ${e}` });
                  setAlertOpen(true);
                })
              },
              onErr: (message) => {
                setAlertDetail({ type: "error", title: "Error", message: message });
                setAlertOpen(true);
              }
            })
          }}>
            <Mui.ListItemIcon><Mui.Icons.Lock /></Mui.ListItemIcon>
            <Mui.ListItemText primary="Password" secondary="Change password" />
          </Mui.ListItemButton>
        </Mui.List>
      </Mui.Box>
    </Mui.CardContent>
  </>
}

export default Profile;