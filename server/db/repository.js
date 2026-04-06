/**
 * server/db/repository.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * FASE 5 — Database Abstraction Layer
 *
 * Controllers NEVER call db.prepare() directly.
 * They call these repository methods instead.
 *
 * This makes the codebase database-agnostic:
 * migrating to PostgreSQL only requires replacing this file.
 */

'use strict'

const { getDb } = require('./index')

/**
 * Find one record by a WHERE clause condition.
 * @param {string} table
 * @param {string} where  — e.g. 'username = ?'
 * @param {any[]}  params
 * @returns {object|undefined}
 */
function findOne(table, where, params = []) {
  return getDb().prepare(`SELECT * FROM ${table} WHERE ${where} LIMIT 1`).get(...params)
}

/**
 * Find multiple records.
 * @param {string} table
 * @param {string} [where]    — optional WHERE clause
 * @param {any[]}  [params]
 * @param {string} [orderBy]  — e.g. 'name ASC'
 * @param {number} [limit]
 * @returns {object[]}
 */
function findMany(table, where = '1=1', params = [], orderBy = '', limit = 0) {
  let sql = `SELECT * FROM ${table} WHERE ${where}`
  if (orderBy) sql += ` ORDER BY ${orderBy}`
  if (limit)   sql += ` LIMIT ${limit}`
  return getDb().prepare(sql).all(...params)
}

/**
 * Run a raw prepared SQL statement with params.
 * Returns the statement info (lastInsertRowid, changes).
 */
function run(sql, params = []) {
  return getDb().prepare(sql).run(...params)
}

/**
 * Run a raw select query.
 */
function query(sql, params = []) {
  return getDb().prepare(sql).all(...params)
}

/**
 * Run a single-row select query.
 */
function queryOne(sql, params = []) {
  return getDb().prepare(sql).get(...params)
}

/**
 * Execute a group of statements inside a transaction.
 * @param {Function} fn — function receiving the db instance
 */
function transaction(fn) {
  return getDb().transaction(fn)()
}

/**
 * Get the raw db instance for complex operations.
 * Use sparingly — prefer the methods above.
 */
function raw() {
  return getDb()
}

module.exports = { findOne, findMany, run, query, queryOne, transaction, raw }
