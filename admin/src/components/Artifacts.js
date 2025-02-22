import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";


const ArtifactTableRow = ({ artifact, setArtifacts, artifacts }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const handleDelete = () => {
    Api.deleteArtifact(artifact.id).then((response) => {
      setArtifacts(artifacts.filter((a) => a.id !== artifact.id));
      setAlertDetail({
        type: "success",
        title: "成功",
        message: "工件删除成功"
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
        {artifact.id}
      </Mui.TableCell>
      <Mui.TableCell>
        {artifact.userId}
      </Mui.TableCell>
      <Mui.TableCell>
        {dayjs.unix(artifact.createTime).format("YYYY-MM-DD HH:mm:ss")}
      </Mui.TableCell>
      <Mui.TableCell>
        {dayjs.unix(artifact.expireTime).format("YYYY-MM-DD HH:mm:ss")}
      </Mui.TableCell>
      <Mui.TableCell>
        <Mui.IconButton aria-label="toggle details" color="secondary" onClick={handleToggleDetails}>
          {showDetails ? <Mui.Icons.ExpandLess /> : <Mui.Icons.ExpandMore />}
        </Mui.IconButton>
        <Mui.IconButton aria-label="download" color="secondary" onClick={() => {
          window.open(Api.getArtifactDownloadUrl(artifact.id))
        }}>
          <Mui.Icons.CloudDownload />
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
                  {'工件 ID: '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {artifact.id}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'创建者 ID: '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {artifact.userId}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'创建时间: '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {dayjs.unix(artifact.createTime).format("YYYY-MM-DD HH:mm:ss")}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={6}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'过期时间: '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {dayjs.unix(artifact.expireTime).format("YYYY-MM-DD HH:mm:ss")}
                </Mui.Typography>
              </Mui.Grid>
              <Mui.Grid item xs={12} sm={12}>
                <Mui.Typography variant='subtitle2' component={'span'}>
                  {'MIME 类型: '}
                </Mui.Typography>
                <Mui.Typography variant='body2' component={'span'}>
                  {artifact.mimetype}
                </Mui.Typography>
              </Mui.Grid>
            </Mui.Grid>
          </Mui.Box>
        </Mui.Collapse>
      </Mui.TableCell>
    </Mui.TableRow>
  </React.Fragment >
}


const Artifacts = () => {
  const [artifacts, setArtifacts] = React.useState([]);
  const [filterUserId, setFilterUserId] = React.useState(null);
  const [filterExpireTime, setFilterExpireTime] = React.useState([dayjs(0), dayjs(0)]);
  const [filterCreateTime, setFilterCreateTime] = React.useState([dayjs(0), dayjs(0)]);
  const [filterMimetype, setFilterMimetype] = React.useState("");
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const buildFilter = () => {
    let filter = {};
    if (filterUserId !== null) {
      filter.userId = filterUserId;
    }
    if (filterExpireTime[0].unix() !== 0) {
      filter.expireTime = [filterExpireTime[0].unix(), filterExpireTime[1].unix()]
    }
    if (filterCreateTime[0].unix() !== 0) {
      filter.createTime = [filterCreateTime[0].unix(), filterCreateTime[1].unix()]
    }
    if (filterMimetype !== "") {
      filter.mimetype = filterMimetype;
    }
    return filter;
  };


  const updateArtifacts = () => {
    Api.getArtifacts(buildFilter()).then((response) => {
      if (response.status) {
        setArtifacts(response.data);
      } else {
        setAlertDetail({
          type: "error",
          title: "错误",
          message: response.message
        });
        setAlertOpen(true);
      }
    }).catch((error) => {
      setAlertDetail({
        type: "error",
        title: "错误",
        message: error.response.data.message
      });
      setAlertOpen(true);
    });
  };

  React.useEffect(() => {
    updateArtifacts();
  }, [filterUserId, filterExpireTime, filterCreateTime]);

  return (
    <>
      <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
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
        <Mui.CardContent>
          <Mui.Box sx={{ marginTop: "10px", width: "100%", borderBottom: 1, borderColor: 'divider' }}>
            <Mui.Grid container spacing={1}>
              <Mui.Grid item xs={10}>
                <Mui.Grid container spacing={1}>
                  <Mui.Grid item xs={6}>
                    <Mui.TextField
                      label="用户 ID"
                      variant="outlined"
                      value={filterUserId}
                      fullWidth
                      onChange={(e) => {
                        try {
                          if (e.target.value !== "") {
                            setFilterUserId(parseInt(e.target.value));
                          } else {
                            setFilterUserId("");
                          }
                        } catch (e) {
                          setFilterUserId("");
                          setAlertDetail({
                            type: "error",
                            title: "错误",
                            message: "无效的用户 ID"
                          });
                          setAlertOpen(true);
                        }
                      }}
                    />
                  </Mui.Grid>
                  <Mui.Grid item xs={6}>
                    <Mui.TextField
                      label="Mime 类型"
                      variant="outlined"
                      value={filterMimetype}
                      fullWidth
                      onChange={(e) => {
                        setFilterMimetype(e.target.value);
                      }}
                    />
                  </Mui.Grid>
                  <Mui.Grid item xs={6} sm={3}>
                    <Mui.DateTimePicker
                      label="创建时间范围：开始"
                      sx={{ width: "100%" }}
                      value={filterCreateTime[0]}
                      onChange={(newValue) => setFilterCreateTime([newValue, filterCreateTime[1] >= filterCreateTime[0] ? filterCreateTime[1] : filterCreateTime[0]])}
                    />
                  </Mui.Grid>
                  <Mui.Grid item xs={6} sm={3}>
                    <Mui.DateTimePicker
                      label="创建时间范围：结束"
                      sx={{ width: "100%" }}
                      value={filterCreateTime[1]}
                      onChange={(newValue) => setFilterCreateTime([filterCreateTime[0] <= filterCreateTime[1] ? filterCreateTime[0] : filterCreateTime[1], newValue])}
                    />
                  </Mui.Grid>
                  <Mui.Grid item xs={6} sm={3}>
                    <Mui.DateTimePicker
                      label="过期时间范围：开始"
                      sx={{ width: "100%" }}
                      value={filterExpireTime[0]}
                      onChange={(newValue) => setFilterExpireTime([newValue, filterExpireTime[1] >= filterExpireTime[0] ? filterExpireTime[1] : filterExpireTime[0]])}
                    />
                  </Mui.Grid>
                  <Mui.Grid item xs={6} sm={3}>
                    <Mui.DateTimePicker
                      label="过期时间范围：结束"
                      sx={{ width: "100%" }}
                      value={filterExpireTime[1]}
                      onChange={(newValue) => setFilterExpireTime([filterExpireTime[0] <= filterExpireTime[1] ? filterExpireTime[0] : filterExpireTime[1], newValue])}
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
            </Mui.Grid>
          </Mui.Box>
          <Mui.Box sx={{ marginTop: "10px", width: "100%", borderBottom: 1, borderColor: 'divider' }}></Mui.Box>
          <Mui.TableContainer component={'div'} >
            <Mui.Table sx={{ width: '100%' }}>
              <Mui.TableHead>
                <Mui.TableRow>
                  <Mui.TableCell>#</Mui.TableCell>
                  <Mui.TableCell>创建者 ID</Mui.TableCell>
                  <Mui.TableCell>创建时间</Mui.TableCell>
                  <Mui.TableCell>过期时间</Mui.TableCell>
                  <Mui.TableCell></Mui.TableCell>
                </Mui.TableRow>
              </Mui.TableHead>
              <Mui.TableBody>
                {artifacts.map((artifact) => (
                  <ArtifactTableRow key={artifact.id} artifact={artifact} setArtifacts={setArtifacts} artifacts={artifacts} />
                ))}
              </Mui.TableBody>
            </Mui.Table>
          </Mui.TableContainer>
        </Mui.CardContent >
      </Mui.LocalizationProvider>
    </>
  );
};

export default Artifacts;