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
  const [availableTime, setAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]); // start time and end time of examination
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
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h5">Create reading examination</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            Left empty for now.
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="Title of examination" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="Duration (minutes)" value={duration} onChange={(e) => {
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
                message: "Duration must be a number."
              });
              setAlertOpen(true);
            }
          }} fullWidth placeholder="Title of examination" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: Begin"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: End"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">Articles and Problems</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            Your examination will consist of a set of articles and problems.
            The articles and problems will be written in markdown format.
            Feel free to paste any images to your markdown content.
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
          <Mui.Typography variant="h6">Answer Sheet Format</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            You will set the answers of this examination, and the format of the answer sheet.
            The answer sheet format is a list of sections, each section has a type (choice or text) and an answer.
            For choice type sections, you will need to provide a list of candidate answers.
            You can add or remove sections as needed.
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
                  message: "Examination created successfully."
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
          }} >Create Examination</Mui.Button>
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
        <Mui.DialogTitle>Edit Reading Examination</Mui.DialogTitle>
        <Mui.DialogContent sx={{ maxWidth: '80vw', overflowY: 'auto' }}>
          <Mui.Grid container spacing={1} sx={{ padding: "10px", width: '100%', height: '50vh', overflowY: 'scroll' }}>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="Title of examination" />
            </Mui.Grid>
            <Mui.Grid item xs={6}>
              <Mui.TextField label="Duration (minutes)" value={duration} onChange={(e) => {
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
                    message: "Duration must be a number."
                  });
                  setAlertOpen(true);
                }
              }} fullWidth placeholder="Title of examination" />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="Available Time Range: Begin"
                sx={{ width: "100%" }}
                value={availableTime[0]}
                onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="Available Time Range: End"
                sx={{ width: "100%" }}
                value={availableTime[1]}
                onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">Articles and Problems</Mui.Typography><br></br>
              <Mui.Typography variant="body1">
                Your examination will consist of a set of articles and problems.
                The articles and problems will be written in markdown format.
                Feel free to paste any images to your markdown content.
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
              <Mui.Typography variant="h6">Answer Sheet Format</Mui.Typography><br></br>
              <Mui.Typography variant="body1">
                You will set the answers of this examination, and the format of the answer sheet.
                The answer sheet format is a list of sections, each section has a type (choice or text) and an answer.
                For choice type sections, you will need to provide a list of candidate answers.
                You can add or remove sections as needed.
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
          <Mui.Button onClick={onClose}>Cancel</Mui.Button>
          <Mui.Button onClick={() => {
            Api.updateReadingExamination(id, title, articles, answerSheetFormat, duration, availableTime.map(a => a.unix()))
              .then((res) => {
                setAlertDetail({
                  type: "success",
                  title: "Success",
                  message: "Examination updated successfully."
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
          }} >Save</Mui.Button>
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
          <Mui.TextField label="Title" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} fullWidth placeholder="Filter by title" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="User ID" value={filterUserId} onChange={(e) => {
            try {
              setFilterUserId(parseInt(e.target.value));
            } catch (e) {
              setFilterUserId(0);
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
      </Mui.Grid>
      <Mui.Box sx={{ width: '100%' }}>
        <Mui.Typography variant="h6"></Mui.Typography><br></br>
      </Mui.Box>
      <Mui.TableContainer>
        <Mui.Table>
          <Mui.TableHead>
            <Mui.TableRow>
              <Mui.TableCell>#</Mui.TableCell>
              <Mui.TableCell>Title</Mui.TableCell>
              <Mui.TableCell>Available Time</Mui.TableCell>
              <Mui.TableCell>User ID</Mui.TableCell>
              <Mui.TableCell>Actions</Mui.TableCell>
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
            message: "No result found in the AI response."
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
          message: "Failed to get AI response."
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
          message: "Examination updated successfully."
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
        <Mui.DialogTitle>Edit Writing Examination</Mui.DialogTitle>
        <Mui.DialogContent>
          <Mui.Grid container spacing={1} sx={{ padding: "10px", width: '100%', height: '50vh', overflowY: 'scroll' }}>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="Title of examination" />
            </Mui.Grid>
            <Mui.Grid item xs={6}>
              <Mui.TextField label="Duration (minutes)" value={duration} onChange={(e) => {
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
                    message: "Duration must be a number."
                  });
                  setAlertOpen(true);
                }
              }} fullWidth placeholder="Title of examination" />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="Available Time Range: Begin"
                sx={{ width: "100%" }}
                value={availableTime[0]}
                onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={6} sm={3}>
              <Mui.DateTimePicker
                label="Available Time Range: End"
                sx={{ width: "100%" }}
                value={availableTime[1]}
                onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
              />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.Typography variant="h6">Problem Statement</Mui.Typography>
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
              <Mui.Typography variant="h6">One Possible Version</Mui.Typography>
              <Mui.Typography variant="body1">
                The possible version is a sample solution to the problem, used for reference for students, which can be generated through AI.
              </Mui.Typography>
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.TextField
                label="One Possible Version"
                value={onePossibleVersion}
                onChange={(e) => setOnePossibleVersion(e.target.value)}
                fullWidth
                placeholder="One possible version of the composition"
                multiline
                rows={4}
              />
              <Mui.Typography variant="body1">
                No ideas? Try generate one using AI! <Mui.Button sx={{ marginLeft: '5px' }} variant="contained" color="primary" onClick={handleAskAI}>Ask AI</Mui.Button>
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
  const [availableTime, setAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]); // start time and end time of examination
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
          message: "Examination created successfully."
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
            message: "No result found in the AI response."
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
          message: "Failed to get AI response."
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
          <Mui.Typography variant="h6">Create Writing Examination</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            A writing examination consists of a problem statement and a one possible version of the composition.
            The problem statement is a prompt for the student to write a composition.
            The one possible version is a sample solution to the problem, used for reference for students, which can be generated through AI.
            The examination will be available for a certain duration and time range, and the student will have to submit their written composition.
            The submission will be examined by AI to judge the fluency, coherence, and originality of the composition.
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth placeholder="Title of examination" />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField label="Duration (minutes)" value={duration} onChange={(e) => {
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
                message: "Duration must be a number."
              });
              setAlertOpen(true);
            }
          }
          } fullWidth placeholder="Title of examination" />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: Begin"
            sx={{ width: "100%" }}
            value={availableTime[0]}
            onChange={(newValue) => setAvailableTime([newValue, availableTime[1]])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={6} sm={3}>
          <Mui.DateTimePicker
            label="Available Time Range: End"
            sx={{ width: "100%" }}
            value={availableTime[1]}
            onChange={(newValue) => setAvailableTime([availableTime[0], newValue])}
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h6">Problem Statement</Mui.Typography><br></br>
          <Mui.Typography variant="body1">
            The problem statement is a prompt for the student to write a composition.
            The prompt should be clear and concise, and should not include any spoilers or hints.
            The prompt should be specific and detailed, and should include the following information:
            <ul>
              <li>The topic of the composition</li>
              <li>The intended audience</li>
              <li>The intended style</li>
              <li>The intended length</li>
              <li>Any specific requirements</li>
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
          <Mui.TextField multiline rows={4} label="One Possible Version" value={onePossibleVersion} onChange={(e) => setOnePossibleVersion(e.target.value)} fullWidth placeholder="One possible version of the composition. Used for reference for students." />
          <Mui.Typography variant="body1" sx={{ padding: 10 }}>
            No ideas? Use AI to generate one!
            <Mui.Button sx={{ marginLeft: 10 }} variant="contained" color="primary" onClick={() => {
              handleAskAI();
            }}>Generate</Mui.Button>
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button fullWidth sx={{ marginTop: '10px' }} variant="contained" color="primary" onClick={handleCreate}>Create</Mui.Button>
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
      </Mui.Grid>
      <Mui.Box sx={{ width: '100%' }}>
        <Mui.Typography variant="h6"></Mui.Typography><br></br>
      </Mui.Box>
      <Mui.TableContainer>
        <Mui.Table>
          <Mui.TableHead>
            <Mui.TableRow>
              <Mui.TableCell>#</Mui.TableCell>
              <Mui.TableCell>Title</Mui.TableCell>
              <Mui.TableCell>Available Time</Mui.TableCell>
              <Mui.TableCell>User ID</Mui.TableCell>
              <Mui.TableCell>Actions</Mui.TableCell>
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


const Examination = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [initiateExaminationCreation, setInitiateExaminationCreation] = React.useState(false);

  return <>
    <Mui.CardContent>
      <Mui.Tabs value={currentTab} onChange={(e, value) => {
        console.log(e, value)
        setCurrentTab(value);
      }}>
        <Mui.Tab label="Reading" value={0} />
        <Mui.Tab label="Writing" value={1} />
        <Mui.Tab label="Listening & Speaking" value={2} />
      </Mui.Tabs>
      <Mui.Box sx={{ width: "100%", height: "100%", borderBottom: 1, borderColor: 'divider' }}>
        {/* <CreateReadingExaminationTab /> */}
        {(currentTab === 0 && !initiateExaminationCreation) && <ReadingExaminationList></ReadingExaminationList>}
        {(currentTab === 0 && initiateExaminationCreation) && <CreateReadingExaminationTab></CreateReadingExaminationTab>}
        {(currentTab === 1 && !initiateExaminationCreation) && <WritingExaminationList></WritingExaminationList>}
        {(currentTab === 1 && initiateExaminationCreation) && <CreateWritingExaminationTab></CreateWritingExaminationTab>}
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