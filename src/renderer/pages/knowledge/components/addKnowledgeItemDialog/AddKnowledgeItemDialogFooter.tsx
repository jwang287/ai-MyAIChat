import { Button, DialogClose } from '@cherrystudio/ui'
import { useTranslation } from 'react-i18next'

import { KnowledgeDialogFooter } from '../KnowledgeDialogLayout'

interface AddKnowledgeItemDialogFooterProps {
  canSubmit: boolean
  errorMessage: string
  isSubmitting: boolean
  onSubmit: () => void | Promise<void>
}

const AddKnowledgeItemDialogFooter = ({
  canSubmit,
  errorMessage,
  isSubmitting,
  onSubmit
}: AddKnowledgeItemDialogFooterProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 overflow-hidden">
      {errorMessage ? (
        <div
          role="alert"
          title={errorMessage}
          className="wrap-break-word max-h-16 w-full min-w-0 overflow-y-auto whitespace-pre-wrap rounded-lg border border-error-border bg-error-subtle px-3 py-2 text-error-subtle-foreground text-xs leading-4">
          {errorMessage}
        </div>
      ) : null}

      <KnowledgeDialogFooter className="items-center sm:justify-end">
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="emphasis"
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            onClick={() => void onSubmit()}>
            {t('common.add')}
          </Button>
        </div>
      </KnowledgeDialogFooter>
    </div>
  )
}

export default AddKnowledgeItemDialogFooter
