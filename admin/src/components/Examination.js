import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";
import MonacoEditor from "./MonacoEditor";
import theme from "../theme";
import AnswerSheetFormatComposer from "./AnswerSheetFormatComposer";


const CreateReadingExaminationTab = () => {
  const [articles, setArticles] = React.useState(""); // markdown of problems
  const [title, setTitle] = React.useState(""); // title of examination
  const [duration, setDuration] = React.useState(0); // duration of examination (minutes)
  const [availableTime, setAvailableTime] = React.useState([dayjs(), dayjs().add(1, "hour")]); // start time and end time of examination
  const [answerSheetFormat, setAnswerSheetFormat] = React.useState([]);
  const [currentTheme, setCurrentTheme] = React.useState(theme.getCurrentThemeMode());
  const editorRef = React.useRef(null);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  theme.listenToThemeModeChange(e => {
    setCurrentTheme(e);
  })



  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <Mui.Grid container spacing={1} sx={{ padding: '10px' }}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">创建阅读理解测试</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            阅读理解测试允许两种题型，分别为选择题和填空题。学生需要根据文本从给定选项中选择正确答案或按照要求填空。
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="测试名称" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="时长（分钟）" value={duration} onChange={(e) => {
            try {
              if (e.target.value !== "") {
                setDuration(parseInt(e.target.value));
              } else {
                setDuration("");
              }
            } catch (e) {
              setAlertDetail({
                type: "error",
                title: "错误",
                message: "时长必须为数字。"
              });
              setAlertOpen(true);
            }
          }} fullWidth placeholder="测试时长" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">文章和题目</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            阅读理解测试将由一系列文章和题目组成。文章和题目均为 Markdown 格式。你可以在 Markdown 内容中通过粘贴自动插入图片。
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <MonacoEditor
            height={"40vh"}
            width={"100%"}
            language={"markdown"}
            value={articles}
            mode={currentTheme}
            onChange={(value) => setArticles(value)}
            onErr={(err) => {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: err.toString()
              });
              setAlertOpen(true);
            }}
            enableArtifactUpload={true} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">答题卡格式</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            您需要设置此考试的答案及答题卡格式。答题卡格式由多个部分组成，每个部分包含类型（选择题或简答题）和答案。选择题类型需提供候选答案列表。您可以根据需要添加或删除部分。
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <AnswerSheetFormatComposer
            value={answerSheetFormat}
            onChange={(value) => setAnswerSheetFormat(value)}
            onErr={(err) => {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: err.toString()
              });
              setAlertOpen(true);
            }} />
        </Mui.Grid>
        <Mui.Grid item xs={12} sx={{ padding: "20px" }}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={() => {
            Api.createReadingExamination(title, articles, answerSheetFormat, duration, availableTime.map(a => a.unix()))
              .then((res) => {
                setAlertDetail({
                  type: "success",
                  title: "Success",
                  message: "成功地创建了测试。"
                });
                setAlertOpen(true);
              })
              .catch((err) => {
                setAlertDetail({
                  type: "error",
                  title: "Error",
                  message: err.toString()
                });
                setAlertOpen(true);
              });
          }} >创建</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
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
    </Mui.LocalizationProvider >
  </>;
}

const EditReadingExaminationDialog = ({ id, onOk, onErr, onClose, open }) => {
  const [title, setTitle] = React.useState(""); // title of examination
  const [duration, setDuration] = React.useState(0); // duration of examination (minutes)
  const [availableTime, setAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]); // start time and end time of examination
  const [answerSheetFormat, setAnswerSheetFormat] = React.useState([]);
  const [currentTheme, setCurrentTheme] = React.useState(theme.getCurrentThemeMode());
  const [articles, setArticles] = React.useState(""); // markdown of problems
  const editorRef = React.useRef(null);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const [examination, setExamination] = React.useState(null);

  React.useEffect(() => {
    Api.getReadingExamination(id)
      .then((res) => {
        if (res.status) {
          setExamination(res.data);
          setTitle(res.data.title);
          setDuration(res.data.duration);
          setAvailableTime([dayjs.unix(res.data.availableTime), dayjs.unix(res.data.expireTime)]);
          setAnswerSheetFormat(res.data.answerSheetFormat);
          setArticles(res.data.passages);
        } else {
          onErr(res.message);
        }
      })
      .catch((err) => {
        onErr(err.toString());
      });
  }, [id]);

  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <Mui.Dialog open={open} onClose={onClose}>
        <Mui.DialogTitle>编辑阅读理解测试</Mui.DialogTitle>
        <Mui.DialogContent sx={{ maxWidth: '80vw', overflowY: 'auto' }}>
          <Mui.Grid container spacing={1} sx={{ padding: "10px", width: '100%', height: '50vh', overflowY: 'scroll' }}>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="测试标题" />
            </Mui.Grid>
            <Mui.Grid item xs={6}>
              <Mui.TextField label="时长（分钟）" value={duration} onChange={(e) => {
                try {
                  if (e.target.value !== "") {
                    setDuration(parseInt(e.target.value));
                  } else {
                    setDuration("");
                  }
                } catch (e) {
                  setAlertDetail({
                    type: "error",
                    title: "Error",
                    message: "时长必须为一个整数。"
                  });
                  setAlertOpen(true);
                }
              }} fullWidth placeholder="测试时长" />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="可用时间范围：开始"
                sx={{ width: "100%" }}
                value={availableTime[0]}
                onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="可用时间范围：结束"
                sx={{ width: "100%" }}
                value={availableTime[1]}
                onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">文章和题目</Mui.Typography><br></br>
              <Mui.Typography variant="body1">
                阅读理解测试将由一系列文章和题目组成。文章和题目均为 Markdown 格式。你可以在 Markdown 内容中通过粘贴自动插入图片。
              </Mui.Typography>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <MonacoEditor
                height={"40vh"}
                width={"100%"}
                language={"markdown"}
                value={articles}
                mode={currentTheme}
                onChange={(value) => setArticles(value)}
                onErr={(err) => {
                  setAlertDetail({
                    type: "error",
                    title: "Error",
                    message: err.toString()
                  });
                  setAlertOpen(true);
                }}
                enableArtifactUpload={true} />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">答题卡格式</Mui.Typography><br></br>
              <Mui.Typography variant="body1">
                您需要设置此考试的答案及答题卡格式。答题卡格式由多个部分组成，每个部分包含类型（选择题或简答题）和答案。选择题类型需提供候选答案列表。您可以根据需要添加或删除部分。
              </Mui.Typography>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <AnswerSheetFormatComposer
                value={answerSheetFormat}
                onChange={(value) => setAnswerSheetFormat(value)}
                onErr={(err) => {
                  setAlertDetail({
                    type: "error",
                    title: "Error",
                    message: err.toString()
                  });
                  setAlertOpen(true);
                }} />
            </Mui.Grid>
          </Mui.Grid>
        </Mui.DialogContent>
        <Mui.DialogActions>
          <Mui.Button onClick={onClose}>取消</Mui.Button>
          <Mui.Button onClick={() => {
            Api.updateReadingExamination(id, title, articles, answerSheetFormat, duration, availableTime.map(a => a.unix()))
              .then((res) => {
                setAlertDetail({
                  type: "success",
                  title: "Success",
                  message: "成功地更新了测试。"
                });
                setAlertOpen(true);
                onClose();
                onOk();
              })
              .catch((err) => {
                setAlertDetail({
                  type: "error",
                  title: "Error",
                  message: err.toString()
                });
                setAlertOpen(true);
              });
          }} >保存</Mui.Button>
        </Mui.DialogActions>
      </Mui.Dialog>
    </Mui.LocalizationProvider>
  </>
}

const ReadingExaminationListItem = ({ examination, onErr, examinationList, setExaminationList, onEdit }) => {
  const handleDelete = () => {
    Api.deleteReadingExamination(examination.id)
      .then(() => {
        setExaminationList(examinationList.filter((e) => e.id !== examination.id));
      })
      .catch((err) => {
        onErr(err.toString());
      });
  }
  return <Mui.TableRow>
    <Mui.TableCell>{examination.id}</Mui.TableCell>
    <Mui.TableCell>{examination.title}</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(examination.availableTime).format("YYYY-MM-DD HH:mm:ss")} - {dayjs.unix(examination.expireTime).format("YYYY-MM-DD HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>{examination.userId}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton edge="end" aria-label="delete" onClick={handleDelete}>
        <Mui.Icons.Delete />
      </Mui.IconButton>
      <Mui.IconButton edge="end" aria-label="edit" onClick={() => {
        onEdit();
      }}>
        <Mui.Icons.Edit />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

const ReadingExaminationList = () => {
  const [examinationList, setExaminationList] = React.useState([]);

  const [filterTitle, setFilterTitle] = React.useState("");
  const [filterAvailableTime, setFilterAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]);
  const [filterUserId, setFilterUserId] = React.useState(0);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const [editReadingExaminationDialogOpen, setEditReadingExaminationDialogOpen] = React.useState(false);
  const [editReadingExaminationId, setEditReadingExaminationId] = React.useState(0);

  const buildFilter = () => {
    const filter = {};
    if (filterTitle !== "") {
      filter.title = filterTitle;
    }
    if (filterAvailableTime[0].unix() !== 0) {
      filter.availableTime = [filterAvailableTime[0].unix(), filterAvailableTime[1].unix()];
    }
    if (filterUserId !== 0) {
      filter.userId = filterUserId;
    }
    return filter;
  }

  const updateExaminationList = () => {
    Api.getReadingExaminationList(buildFilter())
      .then((res) => {
        setExaminationList(res.data);
      })
      .catch((err) => {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: err.toString()
        });
        setAlertOpen(true);
      });
  }

  React.useEffect(() => {
    updateExaminationList();
  }, [filterTitle, filterAvailableTime, filterUserId]);

  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="标题" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} fullWidth placeholder="根据标题筛选" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="用户 ID" value={filterUserId} onChange={(e) => {
            try {
              setFilterUserId(parseInt(e.target.value));
            } catch (e) {
              setFilterUserId(0);
            }
          }} fullWidth placeholder="根据用户 ID 筛选" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={filterAvailableTime[0]}
            onChange={(newValue) => setFilterAvailableTime([newValue, filterAvailableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={filterAvailableTime[1]}
            onChange={(newValue) => setFilterAvailableTime([filterAvailableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={() => {
            updateExaminationList();
          }} >筛选</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
      <Mui.Box sx={{ width: '100%' }}>
        <Mui.Typography variant="h6"></Mui.Typography><br></br>
      </Mui.Box>
      <Mui.TableContainer>
        <Mui.Table>
          <Mui.TableHead>
            <Mui.TableRow>
              <Mui.TableCell>#</Mui.TableCell>
              <Mui.TableCell>标题</Mui.TableCell>
              <Mui.TableCell>可用时间</Mui.TableCell>
              <Mui.TableCell>用户 ID</Mui.TableCell>
              <Mui.TableCell>操作</Mui.TableCell>
            </Mui.TableRow>
          </Mui.TableHead>
          <Mui.TableBody>
            {examinationList.map((examination, index) => <ReadingExaminationListItem
              key={index}
              examination={examination}
              onErr={(err) => {
                setAlertDetail({
                  type: "error",
                  title: "Error",
                  message: err.toString()
                });
                setAlertOpen(true);
              }}
              examinationList={examinationList}
              setExaminationList={setExaminationList}
              onEdit={() => {
                setEditReadingExaminationDialogOpen(true);
                setEditReadingExaminationId(examination.id);
              }}
            ></ReadingExaminationListItem>)}
          </Mui.TableBody>
        </Mui.Table>
      </Mui.TableContainer>
      <EditReadingExaminationDialog
        open={editReadingExaminationDialogOpen}
        id={editReadingExaminationId}
        onOk={() => {
          setEditReadingExaminationDialogOpen(false);
          updateExaminationList();
        }}
        onErr={(err) => {
          setAlertDetail({
            type: "error",
            title: "Error",
            message: err.toString()
          });
          setAlertOpen(true);
        }}
        onClose={() => {
          setEditReadingExaminationDialogOpen(false);
        }}
      ></EditReadingExaminationDialog>
    </Mui.LocalizationProvider>
  </>;
}

const EditWritingExaminationDialog = ({ id, onOk, onErr, onClose, open }) => {
  const [title, setTitle] = React.useState(""); // title of examination
  const [duration, setDuration] = React.useState(0); // duration of examination (minutes)
  const [availableTime, setAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]); // start time and end time of examination
  const [problemStatement, setProblemStatement] = React.useState(""); // problem statement of the examination
  const [onePossibleVersion, setOnePossibleVersion] = React.useState(""); // one possible version of the composition

  const [currentTheme, setCurrentTheme] = React.useState(theme.getCurrentThemeMode());
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const [examination, setExamination] = React.useState(null);

  const handleAskAI = () => {
    let prompt = "You are an skillful English teacher. Your students are struggling with writing compositions. Can you help them? Please write a composition that addresses the following prompt as example. Your final composition should be in the specified format: [result] your composition [/result].\n" + problemStatement;
    Api.ask_ai_only_user_prompt(prompt).then((res) => {
      if (res.status) {
        let theLastResultBegin = res.data.answer.lastIndexOf("[result]") + 8;
        let theLastResultEnd = res.data.answer.lastIndexOf("[/result]");
        if (theLastResultEnd === -1) {
          setAlertDetail({
            type: "error",
            title: "Error",
            message: "没有在返回中找到可用的文本。"
          });
          setAlertOpen(true);
          return;
        }
        let theLastResult = res.data.answer.substring(theLastResultBegin, theLastResultEnd);
        console.log(theLastResult)
        setOnePossibleVersion(theLastResult);
      } else {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: "无法与生成式AI取得通信，请检查网络环境配置。"
        });
        setAlertOpen(true);
      }
    }).catch((err) => {
      setAlertDetail({
        type: "error",
        title: "Error",
        message: err.toString()
      });
      setAlertOpen(true);
    });
  }

  React.useEffect(() => {
    Api.getWritingExamination(id)
      .then((res) => {
        if (res.status) {
          setExamination(res.data);
          setTitle(res.data.title);
          setDuration(res.data.duration);
          setAvailableTime([dayjs.unix(res.data.availableTime), dayjs.unix(res.data.expireTime)]);
          setProblemStatement(res.data.problemStatement);
          setOnePossibleVersion(res.data.onePossibleVersion);
        } else {
          onErr(res.message);
        }
      })
      .catch((err) => {
        onErr(err.toString());
      });
  }, [id]);

  const handleEdit = () => {
    Api.updateWritingExamination(id, title, availableTime.map(a => a.unix()), duration, problemStatement, onePossibleVersion)
      .then((res) => {
        setAlertDetail({
          type: "success",
          title: "Success",
          message: "成功地更新了测试。"
        });
        setAlertOpen(true);
        onClose();
        onOk();
      })
      .catch((err) => {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: err.toString()
        });
        setAlertOpen(true);
      });
  }

  return <>
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
      <Mui.Dialog open={open} onClose={onClose}>
        <Mui.DialogTitle>编辑写作测试</Mui.DialogTitle>
        <Mui.DialogContent>
          <Mui.Grid container spacing={1} sx={{ padding: "10px", width: '100%', height: '50vh', overflowY: 'scroll' }}>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="测试标题" />
            </Mui.Grid>
            <Mui.Grid item xs={6}>
              <Mui.TextField label="时长（分钟）" value={duration} onChange={(e) => {
                try {
                  if (e.target.value !== "") {
                    setDuration(parseInt(e.target.value));
                  } else {
                    setDuration("");
                  }
                } catch (e) {
                  setAlertDetail({
                    type: "error",
                    title: "Error",
                    message: "时长需为一个整数"
                  });
                  setAlertOpen(true);
                }
              }} fullWidth placeholder="测试时长" />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="可用时间范围：开始"
                sx={{ width: "100%" }}
                value={availableTime[0]}
                onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="可用时间范围：结束"
                sx={{ width: "100%" }}
                value={availableTime[1]}
                onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">问题陈述</Mui.Typography>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <MonacoEditor
                height={"20vh"}
                language="markdown"
                value={problemStatement}
                onChange={(value) => setProblemStatement(value)}
              />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">一个可能的版本</Mui.Typography>
              <Mui.Typography variant="body1">
                这是一个示例解决方案，供学生参考。可以由AI生成。
              </Mui.Typography>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.TextField
                label="写作示例"
                value={onePossibleVersion}
                onChange={(e) => setOnePossibleVersion(e.target.value)}
                fullWidth
                placeholder="一个可能的版本"
                multiline
                rows={4}
              />
              <Mui.Typography variant="body1">
                没有想法？使用生成式AI来帮助你写作吧！ <Mui.Button sx={{ marginLeft: '5px' }} variant="contained" color="primary" onClick={handleAskAI}>生成</Mui.Button>
              </Mui.Typography>
            </Mui.Grid>
          </Mui.Grid>
        </Mui.DialogContent>
        <Mui.DialogActions>
          <Mui.Button onClick={onClose}>Cancel</Mui.Button>
          <Mui.Button onClick={handleEdit}>Save</Mui.Button>
        </Mui.DialogActions>
      </Mui.Dialog>
    </Mui.LocalizationProvider>
  </>
}

const CreateWritingExaminationTab = () => {
  const [title, setTitle] = React.useState(""); // title of examination
  const [duration, setDuration] = React.useState(0); // duration of examination (minutes)
  const [availableTime, setAvailableTime] = React.useState([dayjs(), dayjs().add(1, "hour")]); // start time and end time of examination
  const [onePossibleVersion, setOnePossibleVersion] = React.useState(""); // one possible version of the composition
  const [problemStatement, setProblemStatement] = React.useState(""); // problem statement of the examination

  const [currentTheme, setCurrentTheme] = React.useState(theme.getCurrentThemeMode());
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const [examination, setExamination] = React.useState(null);

  const handleCreate = () => {
    Api.createWritingExamination(title, availableTime.map(a => a.unix()), duration, problemStatement, onePossibleVersion)
      .then((res) => {
        setAlertDetail({
          type: "success",
          title: "Success",
          message: "成功地创建了写作测试。"
        });
        setAlertOpen(true);
      })
      .catch((err) => {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: err.toString()
        });
        setAlertOpen(true);
      });
  }

  const handleAskAI = () => {
    let prompt = "You are an skillful English teacher. Your students are struggling with writing compositions. Can you help them? Please write a composition that addresses the following prompt as example. Your final composition should be in the specified format: [result] your composition [/result].\n" + problemStatement;
    Api.ask_ai_only_user_prompt(prompt).then((res) => {
      if (res.status) {

        let theLastResultBegin = res.data.answer.lastIndexOf("[result]") + 8;
        let theLastResultEnd = res.data.answer.lastIndexOf("[/result]");
        if (theLastResultEnd === -1) {
          setAlertDetail({
            type: "error",
            title: "Error",
            message: "没有在返回中找到可用的文本。"
          });
          setAlertOpen(true);
          return;
        }
        let theLastResult = res.data.answer.substring(theLastResultBegin, theLastResultEnd);
        console.log(theLastResult)
        setOnePossibleVersion(theLastResult);
      } else {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: "无法与生成式AI取得通信，请检查网络环境配置。"
        });
        setAlertOpen(true);
      }
    }).catch((err) => {
      setAlertDetail({
        type: "error",
        title: "Error",
        message: err.toString()
      });
      setAlertOpen(true);
    });
  }

  return <>
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
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">创建写作测试</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            写作考试包含题目说明和一个参考范文。题目说明是学生写作的提示。
            参考范文可作为学生参考，可由AI生成。
            考试将在指定时间段开放，学生需在规定时间内提交作文。提交内容将由AI评估流畅度、连贯性和原创性。
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="考试标题" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="时长（分钟）" value={duration} onChange={(e) => {
            try {
              if (e.target.value !== "") {
                setDuration(parseInt(e.target.value));
              } else {
                setDuration("");
              }
            } catch (e) {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: "时长需为一个整数"
              });
              setAlertOpen(true);
            }
          }
          } fullWidth placeholder="考试时长" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">题目说明</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            题目说明是学生写作的提示，应简洁明了，不含任何透题或提示。
            题目说明应具体详细，包括以下内容：
            <ul>
              <li>写作目的</li>
              <li>写作对象</li>
              <li>写作风格</li>
              <li>预期长度</li>
              <li>其他特殊要求</li>
            </ul>
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <MonacoEditor
            height={"40vh"}
            width={"100%"}
            language={"markdown"}
            value={problemStatement}
            mode={currentTheme}
            onChange={(value) => setProblemStatement(value)}
            onErr={(err) => {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: err.toString()
              });
              setAlertOpen(true);
            }}
            enableArtifactUpload={true} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField multiline rows={4} label="一个可能的版本" value={onePossibleVersion} onChange={(e) => setOnePossibleVersion(e.target.value)} fullWidth placeholder="一个可能的版本。供参考。" />
          <Mui.Typography variant="body1" sx={{ padding: 10 }}>
            没有想法？使用生成式AI来帮助你写作吧！
            <Mui.Button sx={{ marginLeft: 10 }} variant="contained" color="primary" onClick={() => {
              handleAskAI();
            }}>生成</Mui.Button>
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={handleCreate}>创建</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.LocalizationProvider>
  </>
}

const WritingExaminationListItem = ({ examination, onErr, examinationList, setExaminationList, onEdit }) => {
  const handleDelete = () => {
    Api.deleteWritingExamination(examination.id)
      .then(() => {
        setExaminationList(examinationList.filter((e) => e.id !== examination.id));
      })
      .catch((err) => {
        onErr(err.toString());
      });
  }
  return <Mui.TableRow>
    <Mui.TableCell>{examination.id}</Mui.TableCell>
    <Mui.TableCell>{examination.title}</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(examination.availableTime).format("YYYY-MM-DD HH:mm:ss")} - {dayjs.unix(examination.expireTime).format("YYYY-MM-DD HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>{examination.userId}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton edge="end" aria-label="delete" onClick={handleDelete}>
        <Mui.Icons.Delete />
      </Mui.IconButton>
      <Mui.IconButton edge="end" aria-label="edit" onClick={() => {
        onEdit();
      }}>
        <Mui.Icons.Edit />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

const WritingExaminationList = () => {
  const [examinationList, setExaminationList] = React.useState([]);

  const [filterTitle, setFilterTitle] = React.useState("");
  const [filterAvailableTime, setFilterAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]);
  const [filterUserId, setFilterUserId] = React.useState(0);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const [editWritingExaminationDialogOpen, setEditWritingExaminationDialogOpen] = React.useState(false);
  const [editWritingExaminationId, setEditWritingExaminationId] = React.useState(0);

  const buildFilter = () => {
    const filter = {};
    if (filterTitle !== "") {
      filter.title = filterTitle;
    }
    if (filterAvailableTime[0].unix() !== 0) {
      filter.availableTime = [filterAvailableTime[0].unix(), filterAvailableTime[1].unix()];
    }
    if (filterUserId !== 0) {
      filter.userId = filterUserId;
    }
    return filter;
  }

  const updateExaminationList = () => {
    Api.getWritingExaminationList(buildFilter())
      .then((res) => {
        setExaminationList(res.data);
      })
      .catch((err) => {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: err.toString()
        });
        setAlertOpen(true);
      });
  }

  React.useEffect(() => {
    updateExaminationList();
  }, [filterTitle, filterAvailableTime, filterUserId]);

  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="标题" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} fullWidth placeholder="依据标题筛选" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="用户ID" value={filterUserId} onChange={(e) => {
            try {
              if (e.target.value !== "") {
                setFilterUserId(parseInt(e.target.value) == NaN ? "" : parseInt(e.target.value));
              } else {
                setFilterUserId("");
              }
            } catch (e) {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: "用户ID需为一个整数"
              });
              setAlertOpen(true);
            }
          }} fullWidth placeholder="依据用户ID筛选" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={filterAvailableTime[0]}
            onChange={(newValue) => setFilterAvailableTime([newValue, filterAvailableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={filterAvailableTime[1]}
            onChange={(newValue) => setFilterAvailableTime([filterAvailableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={() => {
            updateExaminationList();
          }} >筛选</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
      <Mui.Box sx={{ width: '100%' }}>
        <Mui.Typography variant="h6"></Mui.Typography><br></br>
      </Mui.Box>
      <Mui.TableContainer>
        <Mui.Table>
          <Mui.TableHead>
            <Mui.TableRow>
              <Mui.TableCell>#</Mui.TableCell>
              <Mui.TableCell>标题</Mui.TableCell>
              <Mui.TableCell>可用时间</Mui.TableCell>
              <Mui.TableCell>用户ID</Mui.TableCell>
              <Mui.TableCell>操作</Mui.TableCell>
            </Mui.TableRow>
          </Mui.TableHead>
          <Mui.TableBody>
            {examinationList.map((examination, index) => <WritingExaminationListItem
              key={index}
              examination={examination}
              onErr={(err) => {
                setAlertDetail({
                  type: "error",
                  title: "Error",
                  message: err.toString()
                });
                setAlertOpen(true);
              }}
              examinationList={examinationList}
              setExaminationList={setExaminationList}
              onEdit={() => {
                console.log("Editing examination")
                setEditWritingExaminationDialogOpen(true);
                setEditWritingExaminationId(examination.id);
              }}
            ></WritingExaminationListItem>)}
          </Mui.TableBody>
        </Mui.Table>
      </Mui.TableContainer>
      <EditWritingExaminationDialog
        open={editWritingExaminationDialogOpen}
        id={editWritingExaminationId}
        onOk={() => {
          setEditWritingExaminationDialogOpen(false);
          updateExaminationList();
        }}
        onErr={(err) => {
          setAlertDetail({
            type: "error",
            title: "Error",
            message: err.toString()
          });
          setAlertOpen(true);
        }}
        onClose={() => {
          setEditWritingExaminationDialogOpen(false);
        }}
      ></EditWritingExaminationDialog>

    </Mui.LocalizationProvider>
  </>;

}

const EditOralExaminationDialog = ({ open, id, onOk, onErr, onClose }) => {
  const [title, setTitle] = React.useState("");
  const [availableTime, setAvailableTime] = React.useState([dayjs(), dayjs().add(1, "hour")]);
  const [warmUpTopics, setWarmUpTopics] = React.useState([]);
  const [mainTopic, setMainTopic] = React.useState("");
  const [newWarmUpTopic, setNewWarmUpTopic] = React.useState("");

  React.useEffect(() => {
    if (id !== 0) {
      Api.getOralExamination(id).then((res) => {
        setTitle(res.data.title);
        setAvailableTime([dayjs.unix(res.data.availableTime), dayjs.unix(res.data.expireTime)]);
        setWarmUpTopics(res.data.warmUpTopics);
        setMainTopic(res.data.mainTopic);
      }).catch((err) => {
        onErr(err.toString());
      });
    }
  }, [id]);

  const handleSave = () => {
    Api.updateOralExamination(id, title, availableTime.map((t) => t.unix()), warmUpTopics, mainTopic).then((res) => {
      onOk();
    }).catch((err) => {
      onErr(err.toString());
    });
  }

  return <Mui.Dialog open={open} onClose={onClose}>
    <Mui.DialogTitle>编辑口语测试</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="标题" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <PreferredExamTopicInput onChange={topic => setMainTopic(topic)} defaultValue={mainTopic} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.List sx={{ maxHeight: "300px", overflowY: "auto" }}>
            {warmUpTopics.map((topic, index) => <Mui.ListItem key={index}>
              <Mui.ListItemText primary={topic} />
              <Mui.ListItemSecondaryAction>
                <Mui.IconButton edge="end" aria-label="delete" onClick={() => {
                  setWarmUpTopics(warmUpTopics.filter((t) => t !== topic));
                }
                }>
                  <Mui.Icons.Delete />
                </Mui.IconButton>
              </Mui.ListItemSecondaryAction>
            </Mui.ListItem>)}
          </Mui.List>
          <PreferredExamTopicInput onChange={topic => setNewWarmUpTopic(topic)} />
          <Mui.Button onClick={() => {
            setWarmUpTopics([...warmUpTopics, newWarmUpTopic]);
            setNewWarmUpTopic("");
          }} variant="contained" color="primary" sx={{ marginTop: "10px" }}>新增热身话题</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={onClose}>取消</Mui.Button>
      <Mui.Button onClick={handleSave}>保存</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>
}

const OralExaminationListItem = ({ examination, onErr, examinationList, setExaminationList, onEdit }) => {
  const handleDelete = () => {
    Api.deleteOralExamination(examination.id)
      .then(() => {
        setExaminationList(examinationList.filter((e) => e.id !== examination.id));
      })
      .catch((err) => {
        onErr(err.toString());
      });
  }
  return <Mui.TableRow>
    <Mui.TableCell>{examination.id}</Mui.TableCell>
    <Mui.TableCell>{examination.title}</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(examination.availableTime).format("YYYY-MM-DD HH:mm:ss")} - {dayjs.unix(examination.expireTime).format("YYYY-MM-DD HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>{examination.userId}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton edge="end" aria-label="delete" onClick={handleDelete}>
        <Mui.Icons.Delete />
      </Mui.IconButton>
      <Mui.IconButton edge="end" aria-label="edit" onClick={() => {
        onEdit();
      }}>
        <Mui.Icons.Edit />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

const PreferredExamTopicInput = ({ onChange, defaultValue }) => {
  const [preferredExamTopics, setPreferredExamTopics] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    Api.getPreferredExamTopics().then((res) => {
      setPreferredExamTopics(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }, []);

  React.useEffect(() => {
    if (inputValue !== defaultValue && defaultValue) {
      console.log("Setting input value to default value", inputValue, defaultValue);
      setInputValue(defaultValue);
    }
  }, [defaultValue]);

  React.useEffect(() => {
    if (inputValue !== defaultValue) {
      onChange(inputValue);
    }
  }, [inputValue]);

  return <><Mui.TextField
    label="Preferred Exam Topic"
    value={inputValue}
    onChange={(e) => {
      setInputValue(e.target.value);
    }}
    fullWidth
    placeholder="测试主题"
    InputProps={{
      endAdornment: <Mui.InputAdornment position="end">
        <Mui.IconButton edge="end" aria-label="suggestions" onClick={() => {
          setShowSuggestions(true);
        }}><Mui.Icons.Search /></Mui.IconButton>
      </Mui.InputAdornment>
    }}
  />
    <Mui.Dialog open={showSuggestions} onClose={() => {
      setShowSuggestions(false);
    }}>
      <Mui.DialogTitle>参考主题</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.List sx={{ maxHeight: "300px", overflowY: "auto" }}>
          {preferredExamTopics.map((topic, index) => <Mui.ListItemButton key={index} onClick={() => {
            setInputValue(topic);
            setShowSuggestions(false);
          }}>
            <Mui.ListItemText primary={topic} />
          </Mui.ListItemButton>)}
        </Mui.List>
      </Mui.DialogContent>
    </Mui.Dialog>
  </>
}

const CreateOralExaminationTab = () => {
  const [title, setTitle] = React.useState("");
  const [availableTime, setAvailableTime] = React.useState([dayjs(), dayjs().add(1, "hour")]);
  const [warmUpTopics, setWarmUpTopics] = React.useState([]);
  const [newWarmUpTopic, setNewWarmUpTopic] = React.useState("");
  const [mainTopic, setMainTopic] = React.useState("");

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const handleCreate = () => {
    Api.createOralExamination(title, availableTime.map((t) => t.unix()), warmUpTopics, mainTopic).then((res) => {
      setAlertDetail({
        type: "success",
        title: "Success",
        message: "Examination created successfully."
      });
      setAlertOpen(true);
    })
  }

  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">创建口语测试</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            口语考试测试学生英语交流能力，严格遵循雅思口语考试格式。需要填写以下信息：
            <ul>
              <li>考试标题</li>
              <li>可用时间段</li>
              <li>热身话题</li>
              <li>主要话题</li>
            </ul>
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="标题" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="标题" />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <Mui.Typography variant="body1">
              可用时间段是考试可供参加的时间段，你不能具体指定考试时长，因为考试时长因考试而异。
            </Mui.Typography>
          </div>
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：开始"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="可用时间范围：结束"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <Mui.Typography variant="body1">
              热身话题是一个列表，其中包含一些学生在考试中会遇到的简单问题，如“描述你家乡”或“你最喜欢的爱好是什么？”。
              你可以添加任意多的主题，系统会自动从中选择一些作为考试部分一的热身问题。
            </Mui.Typography>
          </div>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.List>
            {warmUpTopics.map((topic, index) => <Mui.ListItem key={index}>
              <Mui.ListItemText primary={topic} />
              <Mui.ListItemSecondaryAction>
                <Mui.IconButton edge="end" aria-label="delete" onClick={() => {
                  const newTopics = [...warmUpTopics];
                  newTopics.splice(index, 1);
                  setWarmUpTopics(newTopics);
                }}><Mui.Icons.Delete /></Mui.IconButton>
              </Mui.ListItemSecondaryAction>
            </Mui.ListItem>)}
          </Mui.List>
          <PreferredExamTopicInput onChange={(topic) => {
            setNewWarmUpTopic(topic);
          }} />
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={() => {
            setWarmUpTopics([...warmUpTopics, newWarmUpTopic])
            setNewWarmUpTopic("");
          }} >新增热身话题</Mui.Button>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <Mui.Typography variant="body1">
              主要话题是考试第二部分和第三部分的讨论主题，将被写在题卡上。
              考生需要就该主题准备2分钟的个人陈述，并做好回答考官提问的准备。
              随后考官将围绕该主题引导深入讨论，话题通常会升华到更抽象的层面。
            </Mui.Typography>
          </div>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <PreferredExamTopicInput onChange={(topic) => {
            setMainTopic(topic);
          }} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={handleCreate}>创建</Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
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
    </Mui.LocalizationProvider>
  </>
}

const OralExaminationList = () => {
  const [examinationList, setExaminationList] = React.useState([]);

  const [filterTitle, setFilterTitle] = React.useState("");
  const [filterAvailableTime, setFilterAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]);
  const [filterUserId, setFilterUserId] = React.useState(0);
  const [editOralExaminationDialogOpen, setEditOralExaminationDialogOpen] = React.useState(false);
  const [editOralExaminationId, setEditOralExaminationId] = React.useState(0);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({
    type: "success",
    title: "",
    message: ""
  });

  const buildFilter = () => {
    const filter = {};
    if (filterTitle !== "") {
      filter.title = filterTitle;
    }
    if (filterAvailableTime[0].unix() !== 0) {
      filter.availableTime = [filterAvailableTime[0].unix(), filterAvailableTime[1].unix()];
    }
    if (filterUserId !== 0) {
      filter.userId = filterUserId;
    }
    return filter;
  }

  const updateExaminationList = () => {
    Api.getOralExaminationList(buildFilter())
      .then((res) => {
        setExaminationList(res.data);
      })
      .catch((err) => {
        setAlertDetail({
          type: "error",
          title: "Error",
          message: err.toString()
        });
        setAlertOpen(true);
      });
  }

  React.useEffect(() => {
    updateExaminationList();
  }, [filterTitle, filterAvailableTime, filterUserId]);

  return <>
    <Mui.LocalizationProvider dateAdapter={Mui.AdapterDayjs}>
      <EditOralExaminationDialog
        open={editOralExaminationDialogOpen}
        id={editOralExaminationId}
        onOk={() => {
          setEditOralExaminationDialogOpen(false);
          updateExaminationList();
        }}
        onErr={(err) => {
          setAlertDetail({
            type: "error",
            title: "Error",
            message: err.toString()
          });
          setAlertOpen(true);
        }}
        onClose={() => {
          setEditOralExaminationDialogOpen(false);
        }}
      ></EditOralExaminationDialog>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="Title" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} fullWidth placeholder="Filter by title" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="User ID" value={filterUserId} onChange={(e) => {
            try {
              if (e.target.value !== "") {
                setFilterUserId(parseInt(e.target.value) == NaN ? "" : parseInt(e.target.value));
              } else {
                setFilterUserId("");
              }
            } catch (e) {
              setAlertDetail({
                type: "error",
                title: "Error",
                message: "User ID must be a number."
              });
              setAlertOpen(true);
            }
          }} fullWidth placeholder="Filter by user ID" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: Begin"
            sx={{ width: "100%" }}
            value={filterAvailableTime[0]}
            onChange={(newValue) => setFilterAvailableTime([newValue, filterAvailableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: End"
            sx={{ width: "100%" }}
            value={filterAvailableTime[1]}
            onChange={(newValue) => setFilterAvailableTime([filterAvailableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={() => {
            updateExaminationList();
          }} >Filter</Mui.Button>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TableContainer>
            <Mui.Table>
              <Mui.TableHead>
                <Mui.TableRow>
                  <Mui.TableCell>#</Mui.TableCell>
                  <Mui.TableCell>标题</Mui.TableCell>
                  <Mui.TableCell>可用时间段</Mui.TableCell>
                  <Mui.TableCell>用户ID</Mui.TableCell>
                  <Mui.TableCell>操作</Mui.TableCell>
                </Mui.TableRow>
              </Mui.TableHead>
              <Mui.TableBody>
                {examinationList.map((examination, index) => <OralExaminationListItem
                  key={index}
                  examination={examination}
                  onErr={(err) => {
                    setAlertDetail({
                      type: "error",
                      title: "Error",
                      message: err.toString()
                    });
                    setAlertOpen(true);
                  }}
                  examinationList={examinationList}
                  setExaminationList={setExaminationList}
                  onEdit={() => {
                    console.log("Editing examination")
                    setEditOralExaminationDialogOpen(true);
                    setEditOralExaminationId(examination.id);
                  }}
                ></OralExaminationListItem>)}
              </Mui.TableBody>
            </Mui.Table>
          </Mui.TableContainer>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.LocalizationProvider>
  </>
}


const Examination = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [initiateExaminationCreation, setInitiateExaminationCreation] = React.useState(false);

  return <>
    <Mui.CardContent>
      <Mui.Tabs value={currentTab} onChange={(e, value) => {
        console.log(e, value)
        setCurrentTab(value);
      }}>
        <Mui.Tab label="阅读" value={0} />
        <Mui.Tab label="写作" value={1} />
        <Mui.Tab label="听力与口语" value={2} />
      </Mui.Tabs>
      <Mui.Box sx={{ width: "100%", height: "100%", borderBottom: 1, borderColor: 'divider' }}>
        {/* <CreateReadingExaminationTab /> */}
        {(currentTab === 0 && !initiateExaminationCreation) && <ReadingExaminationList></ReadingExaminationList>}
        {(currentTab === 0 && initiateExaminationCreation) && <CreateReadingExaminationTab></CreateReadingExaminationTab>}
        {(currentTab === 1 && !initiateExaminationCreation) && <WritingExaminationList></WritingExaminationList>}
        {(currentTab === 1 && initiateExaminationCreation) && <CreateWritingExaminationTab></CreateWritingExaminationTab>}
        {(currentTab === 2 && !initiateExaminationCreation) && <OralExaminationList></OralExaminationList>}
        {(currentTab === 2 && initiateExaminationCreation) && <CreateOralExaminationTab></CreateOralExaminationTab>}
      </Mui.Box>

      {!initiateExaminationCreation && <Mui.Zoom in={!initiateExaminationCreation} timeout={{ enter: 200, exit: 200 }}>
        <Mui.Fab color="primary" aria-label="add" sx={{ position: "fixed", bottom: "10px", right: "10px" }} onClick={() => {
          setInitiateExaminationCreation(true);

        }}><Mui.Icons.Add /></Mui.Fab>
      </Mui.Zoom>}
      {initiateExaminationCreation && <Mui.Zoom in={initiateExaminationCreation} timeout={{ enter: 200, exit: 200 }}>
        <Mui.Fab color="primary" aria-label="close" sx={{ position: "fixed", bottom: "10px", right: "10px" }} onClick={() => {
          setInitiateExaminationCreation(false);
        }}><Mui.Icons.Close /></Mui.Fab>
      </Mui.Zoom>}
    </Mui.CardContent>
  </>
}

export default Examination;