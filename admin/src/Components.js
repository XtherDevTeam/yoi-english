import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CssBaseline from '@mui/material/CssBaseline'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Checkbox from '@mui/material/Checkbox'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Container from '@mui/material/Container'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Drawer from '@mui/material/Drawer'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Backdrop from '@mui/material/Backdrop'
import ButtonGroup from '@mui/material/ButtonGroup'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Fab from '@mui/material/Fab'
import CardActionArea from '@mui/material/CardActionArea'
import Icon from '@mui/material/Icon'
import Stack from '@mui/material/Stack'
import Slider from '@mui/material/Slider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import Fade from '@mui/material/Fade'
import Grow from '@mui/material/Grow'
import Collapse from '@mui/material/Collapse'
import Chip from '@mui/material/Chip'
import { TransitionGroup } from 'react-transition-group'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import LinearProgress from '@mui/material/LinearProgress'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Zoom from '@mui/material/Zoom'
import InputAdornment from '@mui/material/InputAdornment'
import { ListItemSecondaryAction } from '@mui/material'

import Profile from './components/Profile'
import headimg from './assets/headimg.jpg'
import UserManagement from './components/UserManagement'
import Artifacts from './components/Artifacts'
import Examination from './components/Examination'
import ExaminationResult from './components/ExaminationResult'
import OngoingSession from './components/OngoingSession'
import ServerConfiguration from './components/ServerConfiguration'

import * as Icons from '@mui/icons-material'

function IconText(props) {
  return (
    <Stack direction="row" alignItems="center" gap={1} {...props}></Stack>
  )
}

export {
  Avatar, Button, CssBaseline, TextField, FormControlLabel, Checkbox,
  Link, Paper, Box, Grid, LockOutlinedIcon, Typography, Snackbar, Alert,
  AlertTitle, IconButton, Card, CardActions, CardContent,
  CardMedia, Container, AppBar, Toolbar, Drawer,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, List,
  Tab, Tabs, Breadcrumbs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Backdrop, ButtonGroup, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle,
  ListItemAvatar, Menu, MenuItem,
  Fab, CardActionArea, Icon, IconText, Stack, Slider,
  Select, FormControl,
  InputLabel, Switch, FormGroup, Fade, Grow,
  TransitionGroup, Collapse, SwipeableDrawer, Icons,
  LinearProgress, CircularProgress, Profile, headimg, UserManagement,
  Chip, DateTimePicker, Artifacts, LocalizationProvider, AdapterDayjs,
  Examination, Zoom, ExaminationResult, OngoingSession, InputAdornment,
  ListItemSecondaryAction, ServerConfiguration
}