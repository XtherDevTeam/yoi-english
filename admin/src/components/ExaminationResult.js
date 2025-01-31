import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";
import MonacoEditor from "./MonacoEditor";
import theme from "../theme";
import Markdown from "react-markdown";

function ReadingExaminationPreviewDialog({ examId, onClose }) {
  const [examinationResult, setExaminationResult] = React.useState(null);

  React.useEffect(() => {
    if (examId) {
      Api.getReadingExamResult(examId).then(res => {
        setExaminationResult(res.data);
      });
    } else {
      setExaminationResult(null);
    }
  }, [examId]);

  return <>{examinationResult && <Mui.Dialog open={examinationResult !== null} onClose={() => onClose()}>
    <Mui.DialogTitle>Examination Result</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Examination:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.examPaper.title}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Completed Time:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Band:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.band}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Correct ans count:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.correctAnsCount} / {examinationResult.examPaper.answerSheetFormat.length}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Accuracy:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {Math.round(examinationResult.correctAnsCount / examinationResult.examPaper.answerSheetFormat.length * 100)}%
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Feedback:
          </Mui.Typography>
          <Markdown>
            {examinationResult.feedback}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Answer details:
          </Mui.Typography>
          <Mui.List>
            {examinationResult.answerSheet.map((answer, index) => <Mui.ListItem key={index}>
              <Mui.ListItemText primary={`Quest #${index + 1}`} secondary={((answer == examinationResult.examPaper.answerSheetFormat[index].answer) ? 'Correct: ' : 'Incorrect: ') + `${answer} (Correct answer: ${examinationResult.examPaper.answerSheetFormat[index].answer})`} />
            </Mui.ListItem>)}
          </Mui.List>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={() => onClose()}>Close</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>}</>
}

function WritingExaminationPreviewDialog({ examId, onClose }) {
  const [examinationResult, setExaminationResult] = React.useState(null)

  React.useEffect(() => {
    if (examId) {
      Api.getWritingExamResult(examId).then(res => {
        setExaminationResult(res.data);
      });
    } else {
      setExaminationResult(null);
    }
  }, [examId]);

  return <>{examinationResult && <Mui.Dialog open={examinationResult !== null} onClose={() => onClose()}>
    <Mui.DialogTitle>Examination Result</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Examination:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.examPaper.title}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Completed Time:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Band:
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.band}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Feedback:
          </Mui.Typography>
          <Markdown>
            {examinationResult.feedback}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Answer:
          </Mui.Typography>
          <Markdown>
            {examinationResult.answer}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            One possible version:
          </Mui.Typography>
          <Markdown>
            {examinationResult.examPaper.onePossibleVersion}
          </Markdown>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={() => onClose()}>Close</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>}</>
}

function ExaminationResultRow({ examinationResult, examType }) {
  const [readingExamPreviewDialogState, setReadingExamPreviewDialogState] = React.useState(null);
  const [writingExamPreviewDialogState, setWritingExamPreviewDialogState] = React.useState(null);

  return <Mui.TableRow>
    <WritingExaminationPreviewDialog examId={writingExamPreviewDialogState} onClose={() => setWritingExamPreviewDialogState(null)} />
    <ReadingExaminationPreviewDialog examId={readingExamPreviewDialogState} onClose={() => setReadingExamPreviewDialogState(null)} />
    <Mui.TableCell>{examinationResult.id}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.username}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.examPaper.title}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.band}</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton color="primary" onClick={() => {
        if (examType === "reading") {
          setReadingExamPreviewDialogState(examinationResult.id);
        } else if (examType === "writing") {
          setWritingExamPreviewDialogState(examinationResult.id);
        }
      }}>
        <Mui.Icons.Visibility />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

export default function ExaminationResult({ }) {
  const [examinationResultList, setExaminationResultList] = React.useState([]);
  const [currentExamType, setCurrentExamType] = React.useState("reading");
  const [filterExamId, setFilterExamId] = React.useState(0);
  const [filterUserId, setFilterUserId] = React.useState(0);
  const [filterAvailableTime, setFilterAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]);


  React.useEffect(() => {
    if (currentExamType === "reading") {
      Api.getReadingExamResultList().then(res => {
        setExaminationResultList(res.data);
      });
    } else if (currentExamType === "listening") {
      // TODO: implement listening examination result list
    } else if (currentExamType === "writing") {
      Api.getWritingExamResultList().then(res => {
        setExaminationResultList(res.data);
      });
    }
  }, [currentExamType]);

  return <>
    <Mui.CardContent>
      <Mui.Tabs value={currentExamType} onChange={(e, value) => {
        console.log(e, value)
        setCurrentExamType(value);
      }}>
        <Mui.Tab label="Reading" value={'reading'} />
        <Mui.Tab label="Writing" value={'writing'} />
        <Mui.Tab label="Listening & Speaking" value={'listening'} />
      </Mui.Tabs>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.TableContainer>
            <Mui.Table>
              <Mui.TableHead>
                <Mui.TableRow>
                  <Mui.TableCell>#</Mui.TableCell>
                  <Mui.TableCell>Username</Mui.TableCell>
                  <Mui.TableCell>Exam Title</Mui.TableCell>
                  <Mui.TableCell>Band</Mui.TableCell>
                  <Mui.TableCell>Completed Time</Mui.TableCell>
                  <Mui.TableCell>Actions</Mui.TableCell>
                </Mui.TableRow>
              </Mui.TableHead>
              <Mui.TableBody>
                {examinationResultList.map(examinationResult =>
                  <ExaminationResultRow
                    key={examinationResult.id}
                    examinationResult={examinationResult}
                    examType={currentExamType} />)}
              </Mui.TableBody>
            </Mui.Table>
          </Mui.TableContainer>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.CardContent>
  </>
}