import http from 'node:http'
import pug from 'pug'
import url from 'node:url'
import fs from 'node:fs/promises'
import qs from 'node:querystring'

const index_template = pug.compileFile('./index.pug')
const other_template = pug.compileFile('./other.pug')
const style_css = await fs.readFile('./style.css', 'utf8')

const server = http.createServer(getFromClient)

server.listen(3210)
console.log('Server start!')

const data = {
    msg: 'no message...'
}

// ここまでメインプログラム==========

// createServer の処理
async function getFromClient(req: http.IncomingMessage, res: http.ServerResponse) {
    const url_parts = new url.URL(req.url || '', 'http://localhost:3210')

    switch (url_parts.pathname) {
        case '/': {
            await response_index(req, res)
            break
        }
        case '/other': {
            await response_other(req, res)
            break
        }

        default:
            // 想定していないパスへのアクセスが来たときの処理
            res.writeHead(404, {'Content-Type': 'text/plain'})
            res.end('no page...')
            break
    }
}

async function response_index(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method === 'POST') {
        // POSTアクセス時の処理
        const post_data = await parse_body(req)
        data.msg = post_data.msg as string

        setCookie('msg', data.msg, res)

        // リダイレクトする
        res.writeHead(302, 'Found', {
            'Location': '/',
        })
        res.end()
    } else {
        write_index(req, res)
    }
}

async function response_other(req: http.IncomingMessage, res: http.ServerResponse) {
    let msg = 'これはOtherページです。'

    if (req.method === 'POST') {
        const post_data = await (new Promise<qs.ParsedUrlQuery>((resolve, reject) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                try {
                    resolve(qs.parse(body))
                } catch (e) {
                    console.error(e)
                    reject(e)
                }
            })
        }))
        msg += `あなたは「${post_data.msg}」とかきました`
        const content = other_template({
            title: 'Other',
            content: msg,
        })
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
        res.write(content)
        res.end()
    } else {
        // POST 以外のアクセス
        const content = other_template({
            title: 'Other',
            content: 'ページがありません'
        })
        res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'})
        res.write(content)
        res.end()
    }
}

function parse_body(req: http.IncomingMessage): Promise<qs.ParsedUrlQuery> {
    return new Promise((resolve, reject) => {
        let body = ''
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', () => {
            resolve(qs.parse(body))
        })
    })
}

function write_index(req: http.IncomingMessage, res: http.ServerResponse) {
    const cookie_data = getCookie(req)
    const content = index_template({
        title: 'Index',
        content: '※伝言を表示します。',
        data,
        cookie_data
    })
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.write(content)
    res.end()
}

function setCookie(key: string, value: string, res: http.ServerResponse) {
    const encoded_cookie = qs.stringify({[key]: value})
    res.setHeader('Set-Cookie', [encoded_cookie])
}

function getCookie(req: http.IncomingMessage) {
    const cookie_data = req.headers.cookie != undefined
        ? req.headers.cookie : ''
    const data = cookie_data.split(';')
        .map(raw_cookie => qs.parse(raw_cookie.trim()))
        .reduce((acc, cookie) => ({...acc, ...cookie}))
    return data
}