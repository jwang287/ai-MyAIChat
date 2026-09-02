/**
 * The creator registry — the single hand-maintained source for the model catalog.
 * One file per creator; `data/models.json` is generated from these (scripts/generate-catalog.ts).
 * Never edit models.json by hand.
 */
import lab_01ai from './01ai'
import ai21 from './ai21'
import alibaba from './alibaba'
import allenai from './allenai'
import amazon from './amazon'
import anthropic from './anthropic'
import arceeai from './arceeai'
import baai from './baai'
import baichuan from './baichuan'
import baidu from './baidu'
import bailing from './bailing'
import bytedance from './bytedance'
import cogito from './cogito'
import cohere from './cohere'
import deepseek from './deepseek'
import elevenlabs from './elevenlabs'
import google from './google'
import inception from './inception'
import intern from './intern'
import jina from './jina'
import kling from './kling'
import liquidai from './liquidai'
import meituan from './meituan'
import meta from './meta'
import microsoft from './microsoft'
import minimax from './minimax'
import mistral from './mistral'
import moonshot from './moonshot'
import nomic from './nomic'
import nousresearch from './nousresearch'
import nvidia from './nvidia'
import openai from './openai'
import perplexity from './perplexity'
import recraft from './recraft'
import reka from './reka'
import runway from './runway'
import sensetime from './sensetime'
import sentence_transformers from './sentence-transformers'
import sourceful from './sourceful'
import stepfun from './stepfun'
import streamlake from './streamlake'
import suno from './suno'
import tencent from './tencent'
import type { Creator } from './types'
import upstage from './upstage'
import vercel from './vercel'
import vidu from './vidu'
import voyage from './voyage'
import writer from './writer'
import xai from './xai'
import xiaomi from './xiaomi'
import youdao from './youdao'
import zhipu from './zhipu'

export const CREATORS: Creator[] = [
  lab_01ai,
  ai21,
  alibaba,
  allenai,
  amazon,
  anthropic,
  arceeai,
  baai,
  baichuan,
  baidu,
  bailing,
  bytedance,
  cogito,
  cohere,
  deepseek,
  elevenlabs,
  google,
  inception,
  intern,
  jina,
  kling,
  liquidai,
  meituan,
  meta,
  microsoft,
  minimax,
  mistral,
  moonshot,
  nomic,
  nousresearch,
  nvidia,
  openai,
  perplexity,
  recraft,
  reka,
  runway,
  sensetime,
  sentence_transformers,
  stepfun,
  streamlake,
  sourceful,
  suno,
  tencent,
  upstage,
  vercel,
  vidu,
  voyage,
  writer,
  xai,
  xiaomi,
  youdao,
  zhipu
]

export type { Creator, CreatorModel } from './types'
export { defineCreator } from './types'
