import { defineCreator } from './types'

export default defineCreator({
  id: 'kling',
  name: 'Kuaishou (Kling)',
  idPrefixes: ['kling'],
  models: [
    // Kling video models (kolors below is the image model). Request params (duration/mode/cfg) belong on
    // the serving provider; per-op endpoints (lip-sync, extend, multi-elements…) are provider transport.
    {
      id: 'kling-v2-6',
      name: 'Kling v2.6',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v2-5-turbo',
      name: 'Kling v2.5 Turbo',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v2-master',
      name: 'Kling v2 Master',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v2-1',
      name: 'Kling v2.1',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v2-1-master',
      name: 'Kling v2.1 Master',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v1-6',
      name: 'Kling v1.6',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v1-5',
      name: 'Kling v1.5',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    },
    {
      id: 'kling-v1',
      name: 'Kling v1',
      capabilities: ['video-generation'],
      inputModalities: ['text', 'image'],
      outputModalities: ['video']
    }
  ]
})
