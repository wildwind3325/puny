CREATE TABLE [user] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [account] varchar NOT NULL, [password] varchar NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [config] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [user_id] integer NOT NULL,
        [name] nvarchar NOT NULL,
        [value] nvarchar NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [site] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [user_id] integer NOT NULL,
        [name] varchar NOT NULL,
        [url] varchar NOT NULL,
        [count] integer NOT NULL,
        [remark] varchar NOT NULL,
        [created_at] varchar NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [site_account] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [site_id] integer NOT NULL,
        [account] varchar NOT NULL,
        [password] varchar NOT NULL,
        [question] varchar NOT NULL,
        [answer] varchar NOT NULL,
        [remark] varchar NOT NULL,
        [created_at] varchar NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [artist] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [user_id] integer NOT NULL,
        [name] varchar NOT NULL,
        [rating] integer NOT NULL,
        [px_id] varchar NOT NULL,
        [px_updated_to] varchar NOT NULL,
        [ib_id] varchar NOT NULL,
        [ib_updated_to] varchar NOT NULL,
        [remark] varchar NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [forum] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [user_id] integer NOT NULL,
        [name] varchar NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [post] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [forum_id] integer NOT NULL,
        [parent_id] integer NOT NULL,
        [title] varchar NOT NULL,
        [content] varchar NOT NULL,
        [created_at] varchar NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] varchar NOT NULL DEFAULT (datetime('now', 'localtime')));

CREATE TABLE [person] (
        [id] integer NOT NULL PRIMARY KEY AUTOINCREMENT,
        [user_id] integer NOT NULL,
        [name] varchar NOT NULL,
        [company] varchar NOT NULL,
        [title] varchar NOT NULL,
        [phone] varchar NOT NULL,
        [email] varchar NOT NULL,
        [birthday] varchar NOT NULL,
        [address] varchar NOT NULL,
        [remark] varchar NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')),
        [updated_at] datetime NOT NULL DEFAULT (datetime('now', 'localtime')));