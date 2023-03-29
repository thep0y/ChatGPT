use rusqlite::{Connection, Error, OpenFlags};
use std::fmt;
use std::path::{Path, PathBuf};

#[derive(Debug)]
enum Source {
    File(PathBuf),
}

type InitFn = dyn Fn(&mut Connection) -> Result<(), rusqlite::Error> + Send + Sync + 'static;

/// An `r2d2::ManageConnection` for `rusqlite::Connection`s.
pub struct SqliteConnectionManager {
    source: Source,
    flags: OpenFlags,
    init: Option<Box<InitFn>>,
}

impl fmt::Debug for SqliteConnectionManager {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut builder = f.debug_struct("SqliteConnectionManager");
        let _ = builder.field("source", &self.source);
        let _ = builder.field("flags", &self.source);
        let _ = builder.field("init", &self.init.as_ref().map(|_| "InitFn"));
        builder.finish()
    }
}

impl SqliteConnectionManager {
    /// Creates a new `SqliteConnectionManager` from file.
    ///
    /// See `rusqlite::Connection::open`
    pub fn file<P: AsRef<Path>>(path: P) -> Self {
        Self {
            source: Source::File(path.as_ref().to_path_buf()),
            flags: OpenFlags::default(),
            init: None,
        }
    }
}

impl r2d2::ManageConnection for SqliteConnectionManager {
    type Connection = Connection;
    type Error = rusqlite::Error;

    fn connect(&self) -> Result<Connection, Error> {
        match self.source {
            Source::File(ref path) => Connection::open_with_flags(path, self.flags),
        }
        .map_err(Into::into)
        .and_then(|mut c| match self.init {
            None => Ok(c),
            Some(ref init) => init(&mut c).map(|_| c),
        })
    }

    fn is_valid(&self, conn: &mut Connection) -> Result<(), Error> {
        conn.execute_batch("").map_err(Into::into)
    }

    fn has_broken(&self, _: &mut Connection) -> bool {
        false
    }
}
