
import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";
import MonacoEditor from "./MonacoEditor";
import theme from "../theme";

const AnswerSheetFormatAnswerCreatorDialog = ({ open, onOk, onClose, onErr, value }) => {
  const [answer, setAnswer] = React.useState("");
  const [type, setType] = React.useState("choice");
  const [candidateAnswers, setCandidateAnswers] = React.useState([]);

  React.useEffect(() => {
    if (value) {
      setType(value.type);
      setAnswer(value.answer);
      setCandidateAnswers(value.candidateAnswers);
    }
  }, [value]);

  const handleTypeChange = (event) => {
    setType(event.target.value);
  };

  return <Mui.Dialog open={open} onClose={onClose}>
    <Mui.DialogTitle>编辑答题卡章节</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="类型" value={type} onChange={handleTypeChange} select fullWidth>
            <Mui.MenuItem value="choice">选择题</Mui.MenuItem>
            <Mui.MenuItem value="text">简答题</Mui.MenuItem>
          </Mui.TextField>
        </Mui.Grid>
        {type === "choice" &&
          <>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="候选答案" value={candidateAnswers.join(",")} onChange={(e) => setCandidateAnswers(e.target.value.split(",").map((s) => s.trim()))} fullWidth placeholder="候选答案 (以逗号分隔): A, B, C, D" />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="答案" select fullWidth value={answer} onChange={(e) => setAnswer(e.target.value)}>
                {candidateAnswers.map((candidateAnswer, index) => <Mui.MenuItem key={index} value={candidateAnswer}>{candidateAnswer}</Mui.MenuItem>)}
              </Mui.TextField>
            </Mui.Grid>
          </>
        }
        {type === "text" &&
          <>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="答案" value={answer} onChange={(e) => setAnswer(e.target.value)} fullWidth />
            </Mui.Grid>
          </>
        }

      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={onClose}>取消</Mui.Button>
      <Mui.Button onClick={() => {
        if (type === "choice" && candidateAnswers.length === 0) {
          onErr("选择题类型必须提供候选答案。");
          return;
        }
        onOk({ type, answer, candidateAnswers });
        onClose();
      }} >保存</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog >
}


const AnswerSheetFormatComposer = ({ value, onChange, onErr }) => {
  const [answerSheetFormat, setAnswerSheetFormat] = React.useState([]);
  const [currentEditDialogStatus, setCurrenEditDialogStatus] = React.useState({
    open: false,
    value: {
      type: "choice",
      answer: "",
      candidateAnswers: []
    },
    onOk: (value) => { },
    onErr: (err) => { },
    onClose: () => { }
  });

  React.useEffect(() => {
    if (value) {
      setAnswerSheetFormat(value);
    }
  }, [value]);

  return <>
    <Mui.Box sx={{ width: '100%', overflowY: 'scroll' }}>
      <AnswerSheetFormatAnswerCreatorDialog
        open={currentEditDialogStatus.open}
        onOk={currentEditDialogStatus.onOk}
        onErr={currentEditDialogStatus.onErr}
        onClose={currentEditDialogStatus.onClose}
        value={currentEditDialogStatus.value} />
      <Mui.List sx={{ width: '100%' }}>
        {answerSheetFormat.map((item, index) => <>
          <Mui.ListItem key={index} secondaryAction={
            <>
              <Mui.IconButton edge="end" aria-label="edit" onClick={() => {
                setCurrenEditDialogStatus({
                  open: true,
                  value: item,
                  onOk: (value) => {
                    const newAnswerSheetFormat = [...answerSheetFormat];
                    newAnswerSheetFormat[index] = value;
                    setAnswerSheetFormat(newAnswerSheetFormat);
                    onChange(newAnswerSheetFormat);
                    setCurrenEditDialogStatus({
                      open: false,
                      value: {
                        type: "choice",
                        answer: "",
                        candidateAnswers: []
                      },
                      onOk: (value) => { },
                      onErr: (err) => { },
                      onClose: () => { }
                    });
                  },
                  onErr: (err) => { },
                  onClose: () => {
                    setCurrenEditDialogStatus({
                      open: false,
                      value: {
                        type: "choice",
                        answer: "",
                        candidateAnswers: []
                      },
                      onOk: (value) => { },
                      onErr: (err) => { },
                      onClose: () => { }
                    });
                  }
                });
              }}><Mui.Icons.Edit /></Mui.IconButton>
              <Mui.IconButton edge="end" aria-label="delete" onClick={() => {
                const newAnswerSheetFormat = [...answerSheetFormat];
                newAnswerSheetFormat.splice(index, 1);
                setAnswerSheetFormat(newAnswerSheetFormat);
                onChange(newAnswerSheetFormat);
              }}><Mui.Icons.Delete /></Mui.IconButton>
            </>
          }>
            <Mui.ListItemText primary={`章节 ${index + 1}: ${item.type == "choice" ? "选择题" : "简答题"}`} secondary={item.answer} />
          </Mui.ListItem>

        </>)}
        <Mui.ListItemButton onClick={() => {
          setCurrenEditDialogStatus({
            open: true,
            value: {
              type: "choice",
              answer: "",
              candidateAnswers: []
            },
            onOk: (value) => {
              const newAnswerSheetFormat = [...answerSheetFormat];
              newAnswerSheetFormat.push(value);
              setAnswerSheetFormat(newAnswerSheetFormat);
              onChange(newAnswerSheetFormat);
              setCurrenEditDialogStatus({
                open: false,
                value: {
                  type: "choice",
                  answer: "",
                  candidateAnswers: []
                },
                onOk: (value) => { },
                onErr: (err) => { },
                onClose: () => { }
              });
            },
            onErr: (err) => { },
            onClose: () => {
              setCurrenEditDialogStatus({
                open: false,
                value: {
                  type: "choice",
                  answer: "",
                  candidateAnswers: []
                },
                onOk: (value) => { },
                onErr: (err) => { },
                onClose: () => { }
              });
            }
          });
        }}>
          <Mui.ListItemIcon>
            <Mui.Icons.Add />
          </Mui.ListItemIcon>
          <Mui.ListItemText primary="添加章节" secondary="向答题卡格式添加新的章节" />
        </Mui.ListItemButton>
      </Mui.List>
    </Mui.Box>
  </>
}

export default AnswerSheetFormatComposer;
