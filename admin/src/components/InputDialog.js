import React, { useState, useEffect } from "react";
import fs from "../fs";
import Api from "../Api";
import * as Mui from "../Components"

const InputDialog = ({ open, title, description, hint, defaultValue, onClose, onSave }) => {
  const [value, setValue] = useState(defaultValue);

  return <>
    <Mui.Dialog open={open} onClose={onClose}>
      <Mui.DialogTitle>{title}</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.Grid container spacing={1}>
          <Mui.Grid item xs={12}>
            <Mui.Typography variant="body1">{description}</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label={hint}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Mui.Grid>
        </Mui.Grid>
      </Mui.DialogContent>
      <Mui.DialogActions>
        <Mui.Button onClick={onClose}>Cancel</Mui.Button>
        <Mui.Button onClick={() => {
          onSave(value);
          onClose();
        }}>Save</Mui.Button>
      </Mui.DialogActions>
    </Mui.Dialog>
  </>
}

const PasswordConfirmationDialog = ({ open, onClose, onSave, onErr }) => {
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return <>
    <Mui.Dialog open={open} onClose={onClose}>
      <Mui.DialogTitle>Change Password</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.Grid container spacing={1}>
          <Mui.Grid item xs={12}>
            <Mui.Typography variant="body1">Please enter your old password to confirm the change.</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="Old Password"
              type="password"
              value={oldPasswordInput}
              onChange={(e) => setOldPasswordInput(e.target.value)}
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Mui.Grid>
        </Mui.Grid>
      </Mui.DialogContent>
      <Mui.DialogActions>
        <Mui.Button onClick={onClose}>Cancel</Mui.Button>
        <Mui.Button onClick={() => {
          if (password !== confirmPassword) {
            onErr("Passwords do not match");
          } else {
            onSave(oldPasswordInput, password);
            onClose();
          }
        }}>Save</Mui.Button>
      </Mui.DialogActions>
    </Mui.Dialog>
  </>
}

export default {
  InputDialog,
  PasswordConfirmationDialog
};