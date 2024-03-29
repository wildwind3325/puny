var path = require('path');
var Sequelize = require('sequelize');

require('../src/util/enhance');
var cm = require('../src/dao/cm');
var DB = require('../src/dao/db');

var prepare = () => {
  cm.set('default', new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../data/default.db'),
    logging: false
  }));
  cm.set('windtalk', new Sequelize({
    dialect: 'sqlite',
    storage: 'D:/Code/NodeJS/windtalk/app/data/windtalk.db',
    logging: false
  }));
  cm.set('dm', new Sequelize({
    dialect: 'sqlite',
    storage: 'E:/Software/DarkMouse/DM.db',
    logging: false
  }));
};

var sync_site = async () => {
  let db_src = new DB('windtalk');
  let db_tar = new DB();
  let time = new Date().format('yyyy-MM-dd HH:mm:ss');
  let sites = await db_src.find('select * from "site" order by "created_at"');
  for (let i = 0; i < sites.length; i++) {
    let site = {
      user_id: 1,
      name: sites[i].name,
      url: sites[i].url,
      count: sites[i].count,
      remark: sites[i].remark,
      created_at: sites[i].created_at,
      updated_at: sites[i].created_at
    };
    await db_tar.insert('site', site);
    let accounts = await db_src.find('select * from "site_account" where "site_id" = :site_id', { site_id: sites[i].id });
    for (let j = 0; j < accounts.length; j++) {
      await db_tar.insert('site_account', {
        site_id: site.id,
        account: accounts[j].account,
        password: accounts[j].password,
        question: accounts[j].question,
        answer: accounts[j].answer,
        remark: '',
        created_at: time,
        updated_at: time
      });
    }
  }
};

var sync_artist = async () => {
  let db_src = new DB('dm');
  let db_tar = new DB();
  let artists = await db_src.find('select * from "Artists" order by "Create"');
  for (let i = 0; i < artists.length; i++) {
    await db_tar.insert('artist', {
      user_id: 1,
      name: artists[i].Name,
      rating: parseInt(artists[i].Star),
      px_id: artists[i].PixivId,
      px_updated_to: artists[i].PixivImage,
      ib_id: artists[i].InkbunnyId,
      ib_updated_to: artists[i].InkbunnyImage,
      remark: artists[i].Tags,
      created_at: artists[i].Create,
      updated_at: artists[i].Update
    });
  }
};

var sync_note = async () => {
  let db_src = new DB('windtalk');
  let db_tar = new DB();
  let forums = await db_src.find('select * from "forum"');
  for (let i = 0; i < forums.length; i++) {
    let forum = {
      user_id: 1,
      name: forums[i].name,
      created_at: forums[i].created_at,
      updated_at: forums[i].created_at
    };
    await db_tar.insert('forum', forum);
    let posts = await db_src.find('select * from "post" where "forum_id" = :forum_id and "parent_id" = 0', { forum_id: forums[i].id });
    for (let j = 0; j < posts.length; j++) {
      let post = {
        user_id: 1,
        forum_id: forum.id,
        parent_id: 0,
        title: posts[j].title,
        content: posts[j].content,
        created_at: posts[j].created_at,
        updated_at: posts[j].created_at
      };
      await db_tar.insert('post', post);
      let subs = await db_src.find('select * from "post" where "parent_id" = :id', { id: posts[j].id });
      for (let k = 0; k < subs.length; k++) {
        await db_tar.insert('post', {
          user_id: 1,
          forum_id: forum.id,
          parent_id: post.id,
          title: subs[k].title,
          content: subs[k].content,
          created_at: subs[k].created_at,
          updated_at: subs[k].created_at
        });
      }
    }
  }
};

var sync_person = async () => {
  let db_src = new DB('windtalk');
  let db_tar = new DB();
  let persons = await db_src.find('select * from "person"');
  for (let i = 0; i < persons.length; i++) {
    let person = persons[i];
    delete person.id;
    person.user_id = 1;
    person.phone = person.mobile;
    delete person.mobile;
    person.birthday = '';
    person.updated_at = person.created_at;
    await db_tar.insert('person', person);
  }
};

(async () => {
  prepare();
})();