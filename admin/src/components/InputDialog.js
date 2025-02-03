
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
        <Mui.Button onClick={onClose}>取消</Mui.Button>
        <Mui.Button onClick={() => {
          onSave(value);
          onClose();
        }}>保存</Mui.Button>
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
      <Mui.DialogTitle>更改密码</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.Grid container spacing={1}>
          <Mui.Grid item xs={12}>
            <Mui.Typography variant="body1">请输入旧密码以确认更改。</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="旧密码"
              type="password"
              value={oldPasswordInput}
              onChange={(e) => setOldPasswordInput(e.target.value)}
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="新密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              fullWidth
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Mui.Grid>
        </Mui.Grid>
      </Mui.DialogContent>
      <Mui.DialogActions>
        <Mui.Button onClick={onClose}>取消</Mui.Button>
        <Mui.Button onClick={() => {
          if (password !== confirmPassword) {
            onErr("密码不匹配");
          } else {
            onSave(oldPasswordInput, password);
            onClose();
          }
        }}>保存</Mui.Button>
      </Mui.DialogActions>
    </Mui.Dialog>
  </>
}

export default {
  InputDialog,
  PasswordConfirmationDialog
};
