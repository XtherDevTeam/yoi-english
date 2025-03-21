
import React from "react";
import Api from "../Api";
import * as Mui from "../Components";

const PermissionCheckbox = ({ perm, permName, setFilterPerms, filterPerms }) => {
  const [checked, setChecked] = React.useState(filterPerms[perm] == "true");
  React.useEffect(() => {
    console.log(perm, permName, filterPerms, setFilterPerms, checked)
    let newFilterPerms = { ...filterPerms };
    console.log('11111 ', newFilterPerms, filterPerms)
    newFilterPerms[perm] = checked ? "true" : "unset";
    setFilterPerms(newFilterPerms);
  }, [checked]);

  return <>
    <Mui.FormControlLabel
      control={
        <Mui.Checkbox
          checked={filterPerms[perm] == "true"}
          onChange={(e) => {
            setChecked(e.target.checked);
          }}
          name={permName}
          color="primary"
        />
      }
      label={permName}
    />
  </>
};

const PermissionChip = ({ perm, permName, permValue }) => {
  return <Mui.Chip label={`${permName}: ${permValue ? "true" : "false"}`} />
};


const CreateUserDialog = ({ open, onClose, onCreate, onErr }) => {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [oralExamQuota, setOralExamQuota] = React.useState(100);
  const [oralExamViewQuota, setOralExamViewQuota] = React.useState(10);
  const [capabilities, setCapabilities] = React.useState({
    "new_exam_paper_creat": "unset",
    "artifact_creat": "unset",
    "all_exam_result_view": "unset",
    "self_exam_result_view": "unset",
    "artifact_rw": "unset",
    "administrator": "unset"
  });
  const [filterPermList, setFilterPermList] = React.useState({
    "new_exam_paper_creat": "新建试卷",
    "artifact_creat": "创建工件",
    "all_exam_result_view": "查看所有考试结果",
    "self_exam_result_view": "查看个人考试结果",
    "artifact_rw": "读取和写入工件",
    "administrator": "管理员"
  });

  const buildPermissions = () => {
    let permList = {};
    for (let i in capabilities) {
      if (capabilities[i] == "true") {
        permList[i] = true;
      } else {
        permList[i] = false;
      }
    }
    return permList;
  }

  return <>
    <Mui.Dialog open={open} onClose={onClose}>
      <Mui.DialogTitle>创建用户</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.Grid container spacing={1} style={{ padding: 10 }}>
          <Mui.Grid item xs={12}>
            <Mui.Typography variant="body1">
              您可以为学生创建具有必要权限的用户。
              如果您要创建管理员帐户，请记住它将与您具有相同的权限。
            </Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.TextField
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </Mui.Grid>
          <Mui.Grid item xs={6}>
            <Mui.TextField
              label="口试配额"
              type="number"
              value={oralExamQuota}
              onChange={(e) => setOralExamQuota(e.target.value)}
              fullWidth
            />
          </Mui.Grid>
          <Mui.Grid item xs={6}>
            <Mui.TextField
              label="口试查看配额"
              type="number"
              value={oralExamViewQuota}
              onChange={(e) => setOralExamViewQuota(e.target.value)}
              fullWidth
            />
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.Typography variant="h6">权限</Mui.Typography>

          </Mui.Grid>
          <Mui.Grid item xs={12}>
            {Object.keys(filterPermList).map((perm) => (
              <PermissionCheckbox key={`fi-` + perm} perm={perm} permName={filterPermList[perm]} setFilterPerms={setCapabilities} filterPerms={capabilities} />
            ))}
          </Mui.Grid>
        </Mui.Grid>
      </Mui.DialogContent>
      <Mui.DialogActions>
        <Mui.Button onClick={onClose}>取消</Mui.Button>
        <Mui.Button onClick={() => {
          Api.createUser(
            username,
            password,
            email,
            oralExamQuota,
            oralExamViewQuota,
            buildPermissions(capabilities)).then((response) => {
              if (response.status) {
                onCreate();
              } else {
                onErr(response.message);
              }
            }).catch((error) => {
              onErr(error.toString());
            });
          onClose();
        }}>创建</Mui.Button>
      </Mui.DialogActions>
    </Mui.Dialog>
  </>
}


const UserTableRow = ({ user, setUsers, users, filterPermList }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const handleDelete = () => {
    Api.deleteUser(user.id).then((response) => {
      setUsers(users.filter((u) => u.id !== user.id));
      setAlertDetail({
        type: "success",
        title: "成功",
        message: "用户已成功删除"
      });
      setAlertOpen(true);
    }).catch((error) => {
      setAlertDetail({
        type: "error",
        title: "错误",
        message: error.response.data.message
      });
      setAlertOpen(true);
    });
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return <React.Fragment>
    <Mui.TableRow>
      <Mui.TableCell>
        {user.id}
      </Mui.TableCell>
      <Mui.TableCell>
        {user.username}
      </Mui.TableCell>
      <Mui.TableCell>
        {user.email}
      </Mui.TableCell>
      <Mui.TableCell>
        {user.capabilities.administrator ? "是" : "否"}
      </Mui.TableCell>
      <Mui.TableCell>
        <Mui.IconButton aria-label="toggle details" color="secondary" onClick={handleToggleDetails}>
          {showDetails ? <Mui.Icons.ExpandLess /> : <Mui.Icons.ExpandMore />}
        </Mui.IconButton>
        <Mui.IconButton aria-label="delete" color="secondary" onClick={handleDelete}>
          <Mui.Icons.Delete />
        </Mui.IconButton>
      </Mui.TableCell>
    </Mui.TableRow>
    <Mui.TableRow>
      <Mui.TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
        <Mui.Collapse in={showDetails} unmountOnExit>
          <Mui.Box sx={{ margin: 10 }}>
            <Mui.Grid container spacing={1}>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'用户ID： '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {user.id}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'邮箱： '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {user.email}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'口试配额： '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {user.oralExamQuota}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={12}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'权限： '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {Object.keys(filterPermList).map((perm) => (<PermissionChip key={perm} perm={perm} permName={filterPermList[perm]} permValue={user.capabilities[perm]} />))}
                </Mui.Typography>
              </Mui.Grid>
            </Mui.Grid>
          </Mui.Box>
        </Mui.Collapse>
      </Mui.TableCell>
    </Mui.TableRow>
  </React.Fragment >

};

const UserManagement = () => {
  const [users, setUsers] = React.useState([]);
  const [filterUsername, setFilterUsername] = React.useState("");
  const [filterEmail, setFilterEmail] = React.useState("");
  const [filterPermList, setFilterPermList] = React.useState({
    "new_exam_paper_creat": "新建试卷",
    "artifact_creat": "创建工件",
    "all_exam_result_view": "查看所有考试结果",
    "self_exam_result_view": "查看个人考试结果",
    "artifact_rw": "读取和写入工件",
    "administrator": "管理员"
  });
  const [filterPerms, setFilterPerms] = React.useState({
    "new_exam_paper_creat": "unset",
    "artifact_creat": "unset",
    "all_exam_result_view": "unset",
    "self_exam_result_view": "unset",
    "artifact_rw": "unset",
    "administrator": "unset"
  });
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });


  const buildFilter = () => {
    // filter the unset perms and translate strings to boolean values
    let filteredPerms = { ...filterPerms }; // deep copy this motherfucking object
    for (let key in filteredPerms) {
      if (filteredPerms[key] === "unset") {
        delete filteredPerms[key];
      } else {
        filteredPerms[key] = filteredPerms[key] === "true";
      }
    }
    let filter = {}
    if (filterUsername) {
      filter.username = filterUsername;
    }
    if (filterEmail) {
      filter.email = filterEmail;
    }
    if (Object.keys(filteredPerms).length > 0) {
      filter.permissions = filteredPerms;
    }
    return filter;
  };

  const updateUsers = () => {
    Api.getUsers(buildFilter()).then((response) => {
      if (response.status) {
        setUsers(response.data);
      } else {
        setAlertDetail({
          type: "error",
          title: "错误",
          message: response.message,
        });
        setAlertOpen(true);
      }

    }).catch((error) => {
      setAlertDetail({
        type: "error",
        title: "错误",
        message: `无法获取用户：网络错误`
      });
      setAlertOpen(true);
    });
  };

  React.useEffect(() => {
    updateUsers();
  }, [filterUsername, filterEmail, filterPerms]);

  return (
    <>
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
      <CreateUserDialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false) }} onCreate={() => {
        setCreateDialogOpen(false);
        updateUsers();
      }} onErr={(message) => {
        setAlertDetail({
          type: "error",
          title: "错误",
          message: message
        });
        setAlertOpen(true);
      }} />
      <Mui.CardContent>
        <Mui.Box sx={{ marginTop: "10px", width: "100%", borderBottom: 1, borderColor: 'divider' }}>
          <Mui.Grid container spacing={1}>
            <Mui.Grid item xs={10}>
              <Mui.Grid container spacing={1}>
                <Mui.Grid item xs={6}>
                  <Mui.TextField
                    label="用户名"
                    variant="outlined"
                    value={filterUsername}
                    fullWidth
                    onChange={(e) => setFilterUsername(e.target.value)}
                  />
                </Mui.Grid>
                <Mui.Grid item xs={6}>
                  <Mui.TextField
                    label="邮箱"
                    variant="outlined"
                    value={filterEmail}
                    fullWidth
                    onChange={(e) => setFilterEmail(e.target.value)}
                  />
                </Mui.Grid>
              </Mui.Grid>
            </Mui.Grid>
            <Mui.Grid item xs={2}>
              <Mui.Box sx={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}>
                <Mui.Button variant="contained" color="primary" onClick={() => {
                }}>搜索</Mui.Button>
              </Mui.Box>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              {Object.keys(filterPermList).map((perm) => (
                <PermissionCheckbox key={`fj-` + perm} perm={perm} permName={filterPermList[perm]} setFilterPerms={setFilterPerms} filterPerms={filterPerms} />
              ))}
            </Mui.Grid>
          </Mui.Grid>
        </Mui.Box>
        <Mui.Box sx={{ marginTop: "10px", width: "100%", borderBottom: 1, borderColor: 'divider' }}></Mui.Box>
        <Mui.TableContainer component={'div'} >
          <Mui.Table sx={{ width: '100%' }}>
            <Mui.TableHead>
              <Mui.TableRow>
                <Mui.TableCell>#</Mui.TableCell>
                <Mui.TableCell>用户名</Mui.TableCell>
                <Mui.TableCell>邮箱</Mui.TableCell>
                <Mui.TableCell>管理员</Mui.TableCell>
                <Mui.TableCell></Mui.TableCell>
              </Mui.TableRow>
            </Mui.TableHead>
            <Mui.TableBody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={user} setUsers={setUsers} users={users} filterPermList={filterPermList} />
              ))}
            </Mui.TableBody>
          </Mui.Table>
        </Mui.TableContainer>
        <Mui.Fab color="primary" aria-label="add" onClick={() => { setCreateDialogOpen(true) }} sx={{ position: "fixed", bottom: "10px", right: "10px" }}>
          <Mui.Icons.Add />
        </Mui.Fab>
      </Mui.CardContent>
    </>
  );
};

export default UserManagement;
