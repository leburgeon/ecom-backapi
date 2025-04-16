import { useState } from "react";
import { Alert, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotificationBanner = ({ notification }) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapse in={open}>
      <Alert
        severity={notification.severity}
        action={
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2 }}
      >
        {notification.message}
      </Alert>
    </Collapse>
  );
};

export default NotificationBanner;
