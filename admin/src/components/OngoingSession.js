import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";
import MonacoEditor from "./MonacoEditor";
import theme from "../theme";
import Markdown from "react-markdown";

function OngoingSessionRow({ session, onRefresh }) {
  const [toggleOngoingSessionDetailDialog, setToggleOngoingSessionDetailDialog] = React.useState(false);

  const [sessionType, setSessionType] = React.useState({
    reading: 'Reading',
    writing: 'Writing',
    oral: 'Oral'
  });

  return <Mui.TableRow>
    <Mui.Dialog open={toggleOngoingSessionDetailDialog} onClose={() => {
      setToggleOngoingSessionDetailDialog(false);
    }}>
      <Mui.DialogTitle>{session.username}'s ongoing session</Mui.DialogTitle>
      <Mui.DialogContent>
        <Mui.Grid container spacing={1}>
          <Mui.Grid item xs={12}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Examination:
            </Mui.Typography>
            <Mui.Typography variant="body2">{session.examPaper.title}</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12} sm={6}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Duration:
            </Mui.Typography>
            <Mui.Typography variant="body2">{Math.round(session.duration / 60)} minutes</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12} sm={6}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Time started:
            </Mui.Typography>
            <Mui.Typography variant="body2">{dayjs.unix(session.startTime).format("DD/MM/YYYY HH:mm:ss")}</Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item xs={12}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Type:
            </Mui.Typography>
            <Mui.Typography variant="body2">{sessionType[session.type]}</Mui.Typography>
          </Mui.Grid>
          {session.type == 'writing' && <Mui.Grid item xs={12}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Current answer:
            </Mui.Typography>
            <Markdown>
              {session.answer}
            </Markdown>
          </Mui.Grid>}
          {session.type == 'reading' && <Mui.Grid item xs={12}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              Current answer:
            </Mui.Typography>
            <Mui.List>
              {session.answers.map((answer, index) => <Mui.ListItem key={index}>
                <Mui.ListItemText primary={`Question ${index + 1}`} secondary={answer} />
              </Mui.ListItem>)}
            </Mui.List>
          </Mui.Grid>}
          {session.type == 'oral' && <Mui.Grid item xs={12}>
            <Mui.Typography style={{ fontWeight: "bold" }} variant="body1">
              This session is not able to be viewed.
            </Mui.Typography>
          </Mui.Grid>}
        </Mui.Grid>
      </Mui.DialogContent>
      <Mui.DialogActions>
        <Mui.Button onClick={() => {
          onRefresh();
        }}>
          Refresh
        </Mui.Button>
        <Mui.Button onClick={() => {
          setToggleOngoingSessionDetailDialog(false);
        }}>
          Close
        </Mui.Button>
      </Mui.DialogActions>
    </Mui.Dialog>
    <Mui.TableCell>{session.username}</Mui.TableCell>
    <Mui.TableCell>{session.type}</Mui.TableCell>
    <Mui.TableCell>{session.examPaper.title}</Mui.TableCell>
    <Mui.TableCell>{Math.round(session.duration / 60)} minutes</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(session.startTime).format("DD/MM/YYYY HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton onClick={() => {
        setToggleOngoingSessionDetailDialog(true);
      }} color="primary">
        <Mui.Icons.Visibility />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

export default function OngoingSession({ }) {
  const [sessionList, setSessionList] = React.useState([]);

  const refreshSessionList = () => {
    Api.getExamSessionList().then((res) => {
      console.log(res.data);
      setSessionList(res.data);
    });
  }

  React.useEffect(() => {
    refreshSessionList();
  }, []);

  return <>
    <Mui.CardContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.TableContainer>
            <Mui.Table>
              <Mui.TableHead>
                <Mui.TableRow>
                  <Mui.TableCell>Username</Mui.TableCell>
                  <Mui.TableCell>Type</Mui.TableCell>
                  <Mui.TableCell>Title</Mui.TableCell>
                  <Mui.TableCell>Duration</Mui.TableCell>
                  <Mui.TableCell>Time started</Mui.TableCell>
                  <Mui.TableCell>Actions</Mui.TableCell>
                </Mui.TableRow>
              </Mui.TableHead>
              <Mui.TableBody>
                {sessionList.map((session, index) => <OngoingSessionRow key={index} session={session}  onRefresh={refreshSessionList} />)}
              </Mui.TableBody>
            </Mui.Table>
          </Mui.TableContainer>
        </Mui.Grid>
      </Mui.Grid><Mui.Fab color="primary" onClick={() => {
        console.log('refresh')
        refreshSessionList();
      }} sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Mui.Icons.Refresh />
      </Mui.Fab>
    </Mui.CardContent>
  </>
}