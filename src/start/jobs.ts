import PostbackConversionJob from '#jobs/postback_conversion_job'
import ProcessRawConversionJob from '#jobs/process_raw_conversion_job'

const jobs: Record<string, Function> = {
  [ProcessRawConversionJob.name]: () => import('#jobs/process_raw_conversion_job'),
  [PostbackConversionJob.name]: () => import('#jobs/postback_conversion_job'),
}

export { jobs }
