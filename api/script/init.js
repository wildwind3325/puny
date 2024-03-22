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
};

var sync_post = async () => {
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
  await sync_person();
})();