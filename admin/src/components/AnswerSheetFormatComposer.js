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
    <Mui.DialogTitle>Edit answer sheet section</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1} sx={{ padding: "10px" }}>
        <Mui.Grid item xs={12}>
          <Mui.TextField label="Type" value={type} onChange={handleTypeChange} select fullWidth>
            <Mui.MenuItem value="choice">Choice</Mui.MenuItem>
            <Mui.MenuItem value="text">Text</Mui.MenuItem>
          </Mui.TextField>
        </Mui.Grid>
        {type === "choice" &&
          <>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="Candidate Answers" value={candidateAnswers.join(",")} onChange={(e) => setCandidateAnswers(e.target.value.split(",").map((s) => s.trim()))} fullWidth placeholder="Candidate Answers (Separated by comma): A, B, C, D" />
            </Mui.Grid>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="Answer" select fullWidth value={answer} onChange={(e) => setAnswer(e.target.value)}>
                {candidateAnswers.map((candidateAnswer, index) => <Mui.MenuItem key={index} value={candidateAnswer}>{candidateAnswer}</Mui.MenuItem>)}
              </Mui.TextField>
            </Mui.Grid>
          </>
        }
        {type === "text" &&
          <>
            <Mui.Grid item xs={12}>
              <Mui.TextField label="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} fullWidth />
            </Mui.Grid>
          </>
        }

      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={onClose}>Cancel</Mui.Button>
      <Mui.Button onClick={() => {
        if (type === "choice" && candidateAnswers.length === 0) {
          onErr("Candidate Answers must be provided for choice type.");
          return;
        }
        onOk({ type, answer, candidateAnswers });
        onClose();
      }} >Save</Mui.Button>
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
            <Mui.ListItemText primary={`Section ${index + 1}: ${item.type == "choice" ? "Choice" : "Text"}`} secondary={item.answer} />
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
          <Mui.ListItemText primary="Add Section" secondary="Add a new section to the answer sheet format" />
        </Mui.ListItemButton>
      </Mui.List>
    </Mui.Box>
  </>
}

export default AnswerSheetFormatComposer;